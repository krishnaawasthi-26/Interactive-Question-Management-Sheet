package com.iqms.backend.service;

import com.iqms.backend.auth.GoogleTokenPayload;
import com.iqms.backend.auth.GoogleTokenVerifierService;
import com.iqms.backend.config.properties.MailProperties;
import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpInitiateResponse;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.exception.ApiRequestException;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.TokenService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private static final int MAX_USERNAME_CHANGES = 7;
  private static final int MAX_EMAIL_CHANGES = 7;
  private static final Duration OTP_TTL = Duration.ofMinutes(10);
  private static final Duration OTP_RESEND_COOLDOWN = Duration.ofSeconds(60);
  private static final int OTP_MAX_FAILED_ATTEMPTS = 5;
  private static final Duration OTP_LOCK_DURATION = Duration.ofMinutes(10);

  private final UserRepository userRepository;
  private final TokenService tokenService;
  private final LoginAttemptService loginAttemptService;
  private final PasswordEncoder passwordEncoder;
  private final PremiumAccessService premiumAccessService;
  private final AuthMailService authMailService;
  private final GoogleTokenVerifierService googleTokenVerifierService;
  private final MailProperties mailProperties;
  private final SecureRandom secureRandom = new SecureRandom();

  public AuthService(
      UserRepository userRepository,
      TokenService tokenService,
      LoginAttemptService loginAttemptService,
      PasswordEncoder passwordEncoder,
      PremiumAccessService premiumAccessService,
      AuthMailService authMailService,
      GoogleTokenVerifierService googleTokenVerifierService,
      MailProperties mailProperties) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.loginAttemptService = loginAttemptService;
    this.passwordEncoder = passwordEncoder;
    this.premiumAccessService = premiumAccessService;
    this.authMailService = authMailService;
    this.googleTokenVerifierService = googleTokenVerifierService;
    this.mailProperties = mailProperties;
  }

  public SignUpInitiateResponse signUp(SignUpRequest request) {
    String normalizedName = request.getName().trim();
    String normalizedEmail = normalizeEmail(request.getEmail());
    String normalizedUsername = normalizeUsername(request.getUsername());

    User existingByUsername = userRepository.findByUsername(normalizedUsername).orElse(null);
    User user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);

    if (user != null) {
      if (isGoogleProvider(user.getAuthProvider()) && !isLocalProvider(user.getAuthProvider())) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Account exists with Google sign-in. Please continue with Google.");
      }
      if (user.isEmailVerified()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists. Please login.");
      }
      if (existingByUsername != null && !existingByUsername.getId().equals(user.getId())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
      }
      user.setName(normalizedName);
      user.setUsername(normalizedUsername);
      user.setPassword(passwordEncoder.encode(request.getPassword()));
      user.setAuthProvider(withLocalProvider(user.getAuthProvider()));
    } else {
      if (existingByUsername != null) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
      }
      user = new User();
      user.setName(normalizedName);
      user.setEmail(normalizedEmail);
      user.setUsername(normalizedUsername);
      user.setPassword(passwordEncoder.encode(request.getPassword()));
      user.setAuthProvider("LOCAL");
      user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
      user.setCreatedAt(Instant.now());
      user.setUsernameChangeCount(0);
      user.setEmailChangeCount(0);
    }

    user.setEmailVerified(false);
    OtpDispatchResult otpDispatchResult = setAndSendOtp(user, true);
    user = otpDispatchResult.user();
    userRepository.save(user);

    return new SignUpInitiateResponse(
        buildOtpMessage("OTP sent to your email.", otpDispatchResult.otp()),
        user.getEmail(),
        OTP_RESEND_COOLDOWN.getSeconds());
  }

  public SignUpInitiateResponse resendSignupOtp(String email) {
    String normalizedEmail = normalizeEmail(email);
    User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Signup request not found."));

    if (user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account is already verified. Please login.");
    }

    OtpDispatchResult otpDispatchResult = setAndSendOtp(user, false);
    user = otpDispatchResult.user();
    userRepository.save(user);

    return new SignUpInitiateResponse(
        buildOtpMessage("OTP resent successfully.", otpDispatchResult.otp()),
        user.getEmail(),
        OTP_RESEND_COOLDOWN.getSeconds());
  }

  public AuthResponse verifySignupOtp(String email, String otp) {
    String normalizedEmail = normalizeEmail(email);
    User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Signup request not found."));

    if (user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account is already verified. Please login.");
    }

    Instant now = Instant.now();
    if (user.getEmailOtpLockedUntil() != null && user.getEmailOtpLockedUntil().isAfter(now)) {
      long retryAfterSeconds = Duration.between(now, user.getEmailOtpLockedUntil()).toSeconds() + 1;
      throw new ApiRequestException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Too many invalid OTP attempts. Please wait before retrying.",
          "OTP_ATTEMPTS_EXCEEDED",
          retryAfterSeconds,
          null);
    }

    if (user.getEmailOtpHash() == null || user.getEmailOtpExpiresAt() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP not generated. Please resend OTP.");
    }

    if (user.getEmailOtpExpiresAt().isBefore(now)) {
      clearOtpState(user);
      userRepository.save(user);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OTP expired. Please resend OTP.");
    }

    if (!passwordEncoder.matches(otp.trim(), user.getEmailOtpHash())) {
      int attempts = user.getEmailOtpFailedAttempts() + 1;
      user.setEmailOtpFailedAttempts(attempts);
      if (attempts >= OTP_MAX_FAILED_ATTEMPTS) {
        Instant lockedUntil = now.plus(OTP_LOCK_DURATION);
        user.setEmailOtpLockedUntil(lockedUntil);
        userRepository.save(user);
        throw new ApiRequestException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too many invalid OTP attempts. Please wait before retrying.",
            "OTP_ATTEMPTS_EXCEEDED",
            OTP_LOCK_DURATION.getSeconds(),
            null);
      }
      userRepository.save(user);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP. Please try again.");
    }

    user.setEmailVerified(true);
    premiumAccessService.grantNewUserTrialIfEligible(user);
    clearOtpState(user);
    user = userRepository.save(user);
    return toResponse(user);
  }

  public AuthResponse login(LoginRequest request, String deviceKey) {
    loginAttemptService.assertLoginAllowed(deviceKey);
    String normalizedIdentifier = request.getIdentifier().trim().toLowerCase(Locale.ROOT);

    User user = normalizedIdentifier.contains("@")
        ? userRepository.findByEmailIgnoreCase(normalizedIdentifier).orElse(null)
        : userRepository.findByUsername(normalizedIdentifier).orElse(null);

    if (user == null) {
      loginAttemptService.recordFailure(deviceKey);
      loginAttemptService.assertLoginAllowed(deviceKey);
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account does not exist. Please sign up first.");
    }

    if (!isLocalProvider(user.getAuthProvider())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "This account uses Google sign-in. Please continue with Google.");
    }

    if (!user.isEmailVerified()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Please verify your email with OTP before logging in.");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      loginAttemptService.recordFailure(deviceKey);
      loginAttemptService.assertLoginAllowed(deviceKey);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
    }

    loginAttemptService.recordSuccess(deviceKey);
    return toResponse(user);
  }

  public AuthResponse authenticateWithGoogle(String idToken) {
    log.info("[GoogleAuth] Starting Google credential-token auth flow.");
    GoogleTokenPayload payload = googleTokenVerifierService.verify(idToken);
    log.info("[GoogleAuth] Token verified. email={} subject={}", payload.email(), payload.subject());
    User user = userRepository.findByEmailIgnoreCase(payload.email()).orElse(null);
    log.info("[GoogleAuth] User lookup complete. existingUser={}", user != null);

    if (user == null) {
      user = new User();
      user.setName(payload.name().isBlank() ? payload.email() : payload.name());
      user.setEmail(payload.email());
      user.setUsername(generateUniqueUsername(payload.email(), payload.name()));
      user.setAuthProvider("GOOGLE");
      user.setEmailVerified(true);
      user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
      user.setCreatedAt(Instant.now());
      user.setUsernameChangeCount(0);
      user.setEmailChangeCount(0);
      premiumAccessService.grantNewUserTrialIfEligible(user);
      user = userRepository.save(user);
      log.info("[GoogleAuth] New user created. userId={} email={}", user.getId(), user.getEmail());
      AuthResponse response = toResponse(user);
      log.info("[GoogleAuth] Auth response generated for new user. userId={} tokenIssued={}",
          response.getId(), response.getToken() != null && !response.getToken().isBlank());
      return response;
    }

    user.setEmailVerified(true);
    user.setAuthProvider(withGoogleProvider(user.getAuthProvider()));
    if ((user.getName() == null || user.getName().isBlank()) && payload.name() != null && !payload.name().isBlank()) {
      user.setName(payload.name());
    }
    clearOtpState(user);
    user = userRepository.save(user);
    log.info("[GoogleAuth] Existing user updated for Google login. userId={} provider={}",
        user.getId(), user.getAuthProvider());
    // Important: Google and password login intentionally return the same AuthResponse shape
    // so frontend can run one shared success path (token persistence + auth-state redirect).
    AuthResponse response = toResponse(user);
    log.info("[GoogleAuth] Auth response generated for existing user. userId={} tokenIssued={}",
        response.getId(), response.getToken() != null && !response.getToken().isBlank());
    return response;
  }

  private OtpDispatchResult setAndSendOtp(User user, boolean ignoreCooldown) {
    Instant now = Instant.now();
    Instant lastSent = user.getEmailOtpLastSentAt();

    if (!ignoreCooldown && lastSent != null) {
      Instant allowedAt = lastSent.plus(OTP_RESEND_COOLDOWN);
      if (allowedAt.isAfter(now)) {
        long retryAfterSeconds = Duration.between(now, allowedAt).toSeconds() + 1;
        throw new ApiRequestException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Please wait before requesting a new OTP.",
            "OTP_RESEND_COOLDOWN",
            retryAfterSeconds,
            null);
      }
    }

    String otp = generateOtp();
    user.setEmailOtpHash(passwordEncoder.encode(otp));
    user.setEmailOtpExpiresAt(now.plus(OTP_TTL));
    user.setEmailOtpLastSentAt(now);
    user.setEmailOtpFailedAttempts(0);
    user.setEmailOtpLockedUntil(null);

    authMailService.sendSignupOtp(user.getEmail(), otp);
    return new OtpDispatchResult(user, otp);
  }

  private String buildOtpMessage(String baseMessage, String otp) {
    if (mailProperties.isEnabled()) {
      return baseMessage;
    }
    return baseMessage + " Email delivery is disabled on this server, use this OTP: " + otp;
  }

  private void clearOtpState(User user) {
    user.setEmailOtpHash(null);
    user.setEmailOtpExpiresAt(null);
    user.setEmailOtpLastSentAt(null);
    user.setEmailOtpFailedAttempts(0);
    user.setEmailOtpLockedUntil(null);
  }

  private String generateOtp() {
    return String.format("%06d", secureRandom.nextInt(1_000_000));
  }

  private AuthResponse toResponse(User user) {
    String createdAt = user.getCreatedAt() == null ? null : user.getCreatedAt().toString();
    PremiumAccessService.PremiumAccessState accessState = premiumAccessService.resolveAccessState(user);
    String token = tokenService.issueToken(user.getId());
    boolean showPremiumTrialWelcomePopup = premiumAccessService.consumeTrialWelcomePopup(user);

    return new AuthResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getUsername(),
        createdAt,
        user.getProfileShareId(),
        user.getBio(),
        user.getInstitution(),
        user.getCompany(),
        user.getWebsiteUrl(),
        user.getGithubUrl(),
        user.getLinkedinUrl(),
        user.getUsernameChangeCount(),
        Math.max(0, MAX_USERNAME_CHANGES - user.getUsernameChangeCount()),
        user.getEmailChangeCount(),
        Math.max(0, MAX_EMAIL_CHANGES - user.getEmailChangeCount()),
        accessState.premiumActive(),
        accessState.premiumAccessType(),
        accessState.premiumUntil() == null ? null : accessState.premiumUntil().toString(),
        user.getPlanTier(),
        accessState.premiumExpiresAt() == null ? null : accessState.premiumExpiresAt().toString(),
        accessState.premiumTrialStartedAt() == null ? null : accessState.premiumTrialStartedAt().toString(),
        accessState.premiumTrialEndsAt() == null ? null : accessState.premiumTrialEndsAt().toString(),
        accessState.premiumGrantedReason(),
        accessState.hadFreePremiumTrial(),
        showPremiumTrialWelcomePopup,
        token);
  }

  private String normalizeUsername(String username) {
    if (username == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
    }

    String normalized = username.trim().toLowerCase(Locale.ROOT);
    if (!normalized.matches("^[a-z0-9_\\-]{3,30}$")) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Username can use lowercase letters, numbers, _ and - (3-30 chars).");
    }
    return normalized;
  }

  private String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
  }

  private String generateUniqueUsername(String email, String name) {
    String seed = (name == null || name.isBlank()) ? email : name;
    String sanitized = seed.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
    if (sanitized.length() < 3) {
      sanitized = "user";
    }
    if (sanitized.length() > 24) {
      sanitized = sanitized.substring(0, 24);
    }

    String candidate = sanitized;
    int suffix = 1;
    while (userRepository.findByUsername(candidate).isPresent()) {
      String end = String.valueOf(suffix++);
      int maxPrefix = Math.max(1, 30 - end.length());
      String prefix = sanitized.length() > maxPrefix ? sanitized.substring(0, maxPrefix) : sanitized;
      candidate = prefix + end;
    }
    return candidate;
  }

  private boolean isLocalProvider(String provider) {
    return provider != null && provider.toUpperCase(Locale.ROOT).contains("LOCAL");
  }

  private boolean isGoogleProvider(String provider) {
    return provider != null && provider.toUpperCase(Locale.ROOT).contains("GOOGLE");
  }

  private String withGoogleProvider(String provider) {
    if (isGoogleProvider(provider) && isLocalProvider(provider)) {
      return "LOCAL_GOOGLE";
    }
    if (isGoogleProvider(provider)) {
      return "GOOGLE";
    }
    if (isLocalProvider(provider)) {
      return "LOCAL_GOOGLE";
    }
    return "GOOGLE";
  }

  private String withLocalProvider(String provider) {
    if (isLocalProvider(provider) && isGoogleProvider(provider)) {
      return "LOCAL_GOOGLE";
    }
    if (isLocalProvider(provider)) {
      return "LOCAL";
    }
    if (isGoogleProvider(provider)) {
      return "LOCAL_GOOGLE";
    }
    return "LOCAL";
  }

  private record OtpDispatchResult(User user, String otp) {}
}
