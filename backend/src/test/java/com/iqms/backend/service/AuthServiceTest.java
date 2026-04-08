package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.TokenService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private TokenService tokenService;
  @Mock private LoginAttemptService loginAttemptService;
  @Mock private PasswordEncoder passwordEncoder;

  @InjectMocks private AuthService authService;

  private SignUpRequest signUpRequest;

  @BeforeEach
  void setUp() {
    signUpRequest = new SignUpRequest();
    signUpRequest.setName("Jane Doe");
    signUpRequest.setEmail("jane@example.com");
    signUpRequest.setUsername("jane_doe");
    signUpRequest.setPassword("password123");
  }

  @Test
  void signUpCreatesUserWhenEmailAndUsernameAvailable() {
    when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());
    when(userRepository.findByUsername("jane_doe")).thenReturn(Optional.empty());
    when(passwordEncoder.encode("password123")).thenReturn("hashed");
    when(tokenService.issueToken("user-1")).thenReturn("token-1");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
      User saved = invocation.getArgument(0);
      saved.setId("user-1");
      saved.setCreatedAt(Instant.parse("2026-04-08T00:00:00Z"));
      return saved;
    });

    AuthResponse response = authService.signUp(signUpRequest);

    assertThat(response.getId()).isEqualTo("user-1");
    assertThat(response.getToken()).isEqualTo("token-1");
    assertThat(response.getEmail()).isEqualTo("jane@example.com");
  }

  @Test
  void signUpThrowsConflictWhenEmailExists() {
    when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(new User()));

    ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.signUp(signUpRequest));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.CONFLICT.value());
    verify(userRepository, never()).save(any(User.class));
  }

  @Test
  void loginReturnsAuthResponseWhenCredentialsMatch() {
    LoginRequest request = new LoginRequest();
    request.setIdentifier("jane_doe");
    request.setPassword("password123");

    User user = new User();
    user.setId("user-1");
    user.setUsername("jane_doe");
    user.setEmail("jane@example.com");
    user.setPassword("hashed");
    user.setCreatedAt(Instant.parse("2026-04-08T00:00:00Z"));

    when(userRepository.findByUsername("jane_doe")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
    when(tokenService.issueToken("user-1")).thenReturn("token-1");

    AuthResponse response = authService.login(request, "device-1");

    assertThat(response.getToken()).isEqualTo("token-1");
    verify(loginAttemptService).recordSuccess("device-1");
  }

  @Test
  void loginThrowsUnauthorizedForWrongPassword() {
    LoginRequest request = new LoginRequest();
    request.setIdentifier("jane_doe");
    request.setPassword("wrong");

    User user = new User();
    user.setUsername("jane_doe");
    user.setPassword("hashed");

    when(userRepository.findByUsername("jane_doe")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

    ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.login(request, "device-1"));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    verify(loginAttemptService).recordFailure("device-1");
  }
}
