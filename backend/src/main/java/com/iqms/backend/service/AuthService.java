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
  private final UserRepository userRepository;
  private final TokenService tokenService;
  private final LoginAttemptService loginAttemptService;
  private final PasswordEncoder passwordEncoder;
  private final OtpService otpService;
  private final OtpDeliveryService otpDeliveryService;
  private final GoogleTokenVerifier googleTokenVerifier;
  private final Map<String, PendingSignUp> pendingSignUps = new ConcurrentHashMap<>();

  public AuthService(
      UserRepository userRepository,
      TokenService tokenService,
      LoginAttemptService loginAttemptService,
      PasswordEncoder passwordEncoder,
      OtpService otpService,
      OtpDeliveryService otpDeliveryService,
      GoogleTokenVerifier googleTokenVerifier) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.loginAttemptService = loginAttemptService;
    this.passwordEncoder = passwordEncoder;
    this.otpService = otpService;
    this.otpDeliveryService = otpDeliveryService;
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
    GoogleTokenVerifier.GoogleProfile googleProfile = googleTokenVerifier.verify(request.getIdToken());

    User user = userRepository.findByEmail(googleProfile.email()).orElseGet(() -> {
      User created = new User();
      created.setName(googleProfile.name());
      created.setEmail(googleProfile.email());
      created.setUsername(generateUniqueUsername(googleProfile.email()));
      created.setAuthProvider("GOOGLE");
      created.setGoogleSubject(googleProfile.subject());
      created.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
      created.setCreatedAt(Instant.now());
      return userRepository.save(created);
    });

    if (user.getGoogleSubject() == null || user.getGoogleSubject().isBlank()) {
      user.setGoogleSubject(googleProfile.subject());
      user.setAuthProvider("GOOGLE");
      user = userRepository.save(user);
    }

    return toResponse(user);
  }

  private AuthResponse toResponse(User user) {
    String createdAt = user.getCreatedAt() == null ? null : user.getCreatedAt().toString();
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
    String prefix = email.split("@")[0].replaceAll("[^a-zA-Z0-9_-]", "").toLowerCase();
    String base = prefix.length() < 3 ? "google_user" : prefix;
    String candidate = base;
    int suffix = 1;
    while (userRepository.findByUsername(candidate).isPresent()) {
      candidate = (base + suffix).substring(0, Math.min(30, (base + suffix).length()));
      suffix += 1;
    }
    return candidate;
  }

  private record PendingSignUp(String name, String email, String username, String encodedPassword) {}
}
