package com.iqms.backend.service;

import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final UserRepository userRepository;

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public AuthResponse signUp(SignUpRequest request) {
    String normalizedName = request.getName().trim();
    String normalizedEmail = request.getEmail().trim().toLowerCase();
    String normalizedPassword = request.getPassword().trim();

    if (userRepository.findByEmail(normalizedEmail).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists. Please login.");
    }

    User user = new User();
    user.setName(normalizedName);
    user.setEmail(normalizedEmail);
    user.setPassword(normalizedPassword);
    user.setCreatedAt(Instant.now());

    User created = userRepository.save(user);
    return toResponse(created);
  }

  public AuthResponse login(LoginRequest request) {
    String normalizedEmail = request.getEmail().trim().toLowerCase();
    String normalizedPassword = request.getPassword().trim();

    User user = userRepository
        .findByEmail(normalizedEmail)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Account does not exist. Please sign up first."));

    if (!user.getPassword().equals(normalizedPassword)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password. Please try again.");
    }

    return toResponse(user);
  }

  private AuthResponse toResponse(User user) {
    String createdAt = user.getCreatedAt() == null ? null : user.getCreatedAt().toString();
    return new AuthResponse(user.getId(), user.getName(), user.getEmail(), createdAt);
  }
}
