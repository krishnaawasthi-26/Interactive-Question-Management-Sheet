package com.iqms.backend.service;

import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.TokenService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private static final int MAX_USERNAME_CHANGES = 7;
  private static final int MAX_EMAIL_CHANGES = 7;
  private final UserRepository userRepository;
  private final TokenService tokenService;
  private final LoginAttemptService loginAttemptService;
  private final PasswordEncoder passwordEncoder;
  private final PremiumAccessService premiumAccessService;

  public AuthService(
      UserRepository userRepository,
      TokenService tokenService,
      LoginAttemptService loginAttemptService,
      PasswordEncoder passwordEncoder,
      PremiumAccessService premiumAccessService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.loginAttemptService = loginAttemptService;
    this.passwordEncoder = passwordEncoder;
    this.premiumAccessService = premiumAccessService;
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

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      loginAttemptService.recordFailure(deviceKey);
      loginAttemptService.assertLoginAllowed(deviceKey);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
    }

    loginAttemptService.recordSuccess(deviceKey);
    return toResponse(user);
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
}
