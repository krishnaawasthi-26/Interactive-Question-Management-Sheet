package com.iqms.backend.service;

import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.GoogleLoginRequest;
import com.iqms.backend.dto.OtpChallengeResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.dto.VerifyOtpRequest;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.TokenService;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private static final String OTP_PURPOSE_SIGNUP = "signup";
  private static final int MAX_USERNAME_CHANGES = 7;
  private static final int MAX_EMAIL_CHANGES = 7;
  private final UserRepository userRepository;
  private final TokenService tokenService;
  private final LoginAttemptService loginAttemptService;
  private final PasswordEncoder passwordEncoder;
  private final OtpService otpService;
  private final OtpDeliveryService otpDeliveryService;
  private final PremiumAccessService premiumAccessService;
  private final GoogleTokenVerifier googleTokenVerifier;
  private final Map<String, PendingSignUp> pendingSignUps = new ConcurrentHashMap<>();

  public AuthService(
      UserRepository userRepository,
      TokenService tokenService,
      LoginAttemptService loginAttemptService,
      PasswordEncoder passwordEncoder,
      OtpService otpService,
      OtpDeliveryService otpDeliveryService,
      PremiumAccessService premiumAccessService,
      GoogleTokenVerifier googleTokenVerifier) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.loginAttemptService = loginAttemptService;
    this.passwordEncoder = passwordEncoder;
    this.otpService = otpService;
    this.otpDeliveryService = otpDeliveryService;
    this.premiumAccessService = premiumAccessService;
    this.googleTokenVerifier = googleTokenVerifier;
  }

  public OtpChallengeResponse requestSignUpOtp(SignUpRequest request) {
    String normalizedName = request.getName().trim();
    String normalizedEmail = request.getEmail().trim().toLowerCase();
    String normalizedUsername = normalizeUsername(request.getUsername());

    if (userRepository.findByEmail(normalizedEmail).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists. Please login.");
    }
    if (userRepository.findByUsername(normalizedUsername).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
    }

    String signUpPayloadId = UUID.randomUUID().toString();
    pendingSignUps.put(
        signUpPayloadId,
        new PendingSignUp(
            normalizedName,
            normalizedEmail,
            normalizedUsername,
            passwordEncoder.encode(request.getPassword())));

    OtpService.OtpChallenge challenge = otpService.issueOtp(normalizedEmail, OTP_PURPOSE_SIGNUP, signUpPayloadId);
    otpDeliveryService.sendOtp(normalizedEmail, "signup", challenge.code());

    return new OtpChallengeResponse(challenge.verificationId(), "OTP sent to your email for account verification.");
  }

  public AuthResponse signUp(SignUpRequest request) {
    String normalizedName = request.getName().trim();
    String normalizedEmail = request.getEmail().trim().toLowerCase();
    String normalizedUsername = normalizeUsername(request.getUsername());

    if (userRepository.findByEmail(normalizedEmail).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists. Please login.");
    }
    if (userRepository.findByUsername(normalizedUsername).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
    }

    User user = new User();
    user.setName(normalizedName);
    user.setEmail(normalizedEmail);
    user.setUsername(normalizedUsername);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setAuthProvider("LOCAL");
    user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
    user.setCreatedAt(Instant.now());
    user.setUsernameChangeCount(0);
    user.setEmailChangeCount(0);
    user.setGoogleOnboardingComplete(true);
    user.setPremiumTrialEndsAt(Instant.now().plusSeconds(60));

    User created = userRepository.save(user);
    return toResponse(created);
  }

  public AuthResponse verifySignUpOtp(VerifyOtpRequest request) {
    OtpService.OtpRecord otpRecord = otpService.verifyOtp(request.getVerificationId(), request.getOtp(), OTP_PURPOSE_SIGNUP);
    PendingSignUp pending = pendingSignUps.remove(otpRecord.payloadKey());
    if (pending == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Signup verification session expired.");
    }

    if (userRepository.findByEmail(pending.email()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists. Please login.");
    }
    if (userRepository.findByUsername(pending.username()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
    }

    User user = new User();
    user.setName(pending.name());
    user.setEmail(pending.email());
    user.setUsername(pending.username());
    user.setPassword(pending.encodedPassword());
    user.setAuthProvider("LOCAL");
    user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
    user.setCreatedAt(Instant.now());
    user.setUsernameChangeCount(0);
    user.setEmailChangeCount(0);
    user.setGoogleOnboardingComplete(true);
    user.setPremiumTrialEndsAt(Instant.now().plusSeconds(60));

    User created = userRepository.save(user);
    return toResponse(created);
  }

  public AuthResponse login(LoginRequest request, String deviceKey) {
    loginAttemptService.assertLoginAllowed(deviceKey);
    String normalizedIdentifier = request.getIdentifier().trim().toLowerCase();

    User user = normalizedIdentifier.contains("@")
        ? userRepository.findByEmail(normalizedIdentifier).orElse(null)
        : userRepository.findByUsername(normalizedIdentifier).orElse(null);

    if (user == null) {
      loginAttemptService.recordFailure(deviceKey);
      loginAttemptService.assertLoginAllowed(deviceKey);
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account does not exist. Please sign up first.");
    }

    if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && (user.getPassword() == null || user.getPassword().isBlank())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Use Google login for this account.");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      loginAttemptService.recordFailure(deviceKey);
      loginAttemptService.assertLoginAllowed(deviceKey);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
    }

    loginAttemptService.recordSuccess(deviceKey);
    return toResponse(user);
  }

  public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
    GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(request.getIdToken());

    User existingGoogleUser = userRepository.findByGoogleSubject(profile.subject()).orElse(null);
    if (existingGoogleUser != null) {
      return toResponse(existingGoogleUser);
    }

    User emailUser = userRepository.findByEmail(profile.email()).orElse(null);
    if (emailUser != null) {
      if (!"GOOGLE".equalsIgnoreCase(emailUser.getAuthProvider())) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "An account with this email already exists. Please login with password.");
      }
      emailUser.setGoogleSubject(profile.subject());
      User updated = userRepository.save(emailUser);
      return toResponse(updated);
    }

    User user = new User();
    user.setName(profile.name());
    user.setEmail(profile.email());
    user.setUsername(generateUniqueUsername(profile.email()));
    user.setAuthProvider("GOOGLE");
    user.setGoogleSubject(profile.subject());
    user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
    user.setCreatedAt(Instant.now());
    user.setUsernameChangeCount(0);
    user.setEmailChangeCount(0);
    user.setGoogleOnboardingComplete(true);
    user.setBio("Signed up with Google");
    user.setCompany("Google");
    user.setPremiumTrialEndsAt(Instant.now().plusSeconds(60));

    User created = userRepository.save(user);
    return toResponse(created);
  }

  private AuthResponse toResponse(User user) {
    String createdAt = user.getCreatedAt() == null ? null : user.getCreatedAt().toString();
    String premiumUntil = user.getPremiumUntil() == null ? null : user.getPremiumUntil().toString();
    String premiumTrialEndsAt = user.getPremiumTrialEndsAt() == null ? null : user.getPremiumTrialEndsAt().toString();
    String token = tokenService.issueToken(user.getId());
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
        "GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && !user.isGoogleOnboardingComplete(),
        premiumAccessService.isPremiumActive(user),
        premiumUntil,
        premiumTrialEndsAt,
        token);
  }

  private String normalizeUsername(String username) {
    if (username == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
    }

    String normalized = username.trim().toLowerCase();
    if (!normalized.matches("^[a-z0-9_\\-]{3,30}$")) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Username can use lowercase letters, numbers, _ and - (3-30 chars).");
    }
    return normalized;
  }

  private String generateUniqueUsername(String email) {
    String local = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
    String base = local.toLowerCase().replaceAll("[^a-z0-9_-]", "");
    if (base.length() < 3) {
      base = "googleuser";
    }
    if (base.length() > 24) {
      base = base.substring(0, 24);
    }

    String candidate = base;
    int suffix = 1;
    while (userRepository.findByUsername(candidate).isPresent()) {
      String suffixText = "_" + suffix;
      int maxBaseLength = Math.max(3, 30 - suffixText.length());
      String trimmedBase = base.length() > maxBaseLength ? base.substring(0, maxBaseLength) : base;
      candidate = trimmedBase + suffixText;
      suffix++;
    }
    return candidate;
  }

  private record PendingSignUp(String name, String email, String username, String encodedPassword) {}
}
