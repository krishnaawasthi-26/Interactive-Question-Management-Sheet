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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final TokenService tokenService;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository userRepository, TokenService tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  public AuthResponse signUp(SignUpRequest request) {
    String normalizedName = request.getName().trim();
    String normalizedEmail = request.getEmail().trim().toLowerCase();
    String normalizedUsername = normalizeUsername(request.getUsername());
    String normalizedPassword = request.getPassword().trim();

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
    user.setPassword(passwordEncoder.encode(normalizedPassword));
    user.setProfileShareId("profile_" + UUID.randomUUID().toString().replace("-", ""));
    user.setCreatedAt(Instant.now());

    User created = userRepository.save(user);
    return toResponse(created);
  }

  public AuthResponse login(LoginRequest request) {
    String normalizedIdentifier = request.getIdentifier().trim().toLowerCase();
    String normalizedPassword = request.getPassword().trim();

    User user = normalizedIdentifier.contains("@")
        ? userRepository.findByEmail(normalizedIdentifier).orElse(null)
        : userRepository.findByUsername(normalizedIdentifier).orElse(null);

    if (user == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account does not exist. Please sign up first.");
    }

    if (!passwordEncoder.matches(normalizedPassword, user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
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
}
