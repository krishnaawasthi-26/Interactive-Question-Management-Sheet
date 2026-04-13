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
  @Mock private OtpService otpService;
  @Mock private OtpDeliveryService otpDeliveryService;
  @Mock private PremiumAccessService premiumAccessService;
  @Mock private GoogleTokenVerifier googleTokenVerifier;

  @InjectMocks private AuthService authService;

  private SignUpRequest signUpRequest;

  @BeforeEach
  void setUp() {
    when(premiumAccessService.isPremiumActive(any())).thenReturn(false);
    signUpRequest = new SignUpRequest();
    signUpRequest.setName("Jane Doe");
    signUpRequest.setEmail("jane@example.com");
    signUpRequest.setUsername("jane_doe");
    signUpRequest.setPassword("password123");
  }

  @Test
  void requestSignUpOtpCreatesChallengeWhenEmailAndUsernameAvailable() {
    when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());
    when(userRepository.findByUsername("jane_doe")).thenReturn(Optional.empty());
    when(passwordEncoder.encode("password123")).thenReturn("hashed");
    when(otpService.issueOtp("jane@example.com", "signup", any())).thenReturn(new OtpService.OtpChallenge("verify-1", "123456"));

    var challenge = authService.requestSignUpOtp(signUpRequest);

    assertThat(challenge.getVerificationId()).isEqualTo("verify-1");
    verify(otpDeliveryService).sendOtp("jane@example.com", "signup", "123456");
  }

  @Test
  void requestSignUpOtpThrowsConflictWhenEmailExists() {
    when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(new User()));

    ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.requestSignUpOtp(signUpRequest));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.CONFLICT.value());
    verify(otpService, never()).issueOtp(any(), any(), any());
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
}
