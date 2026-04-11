package com.iqms.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.OtpChallengeResponse;
import com.iqms.backend.exception.GlobalExceptionHandler;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @MockitoBean private AuthService authService;
  @MockitoBean private RequestFingerprintService requestFingerprintService;

  @Test
  void requestSignupOtpReturnsChallengeForValidPayload() throws Exception {
    when(authService.requestSignUpOtp(any())).thenReturn(new OtpChallengeResponse("verify-1", "OTP sent"));

    mockMvc.perform(post("/api/auth/signup/request-otp")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(java.util.Map.of(
                "name", "Jane",
                "email", "jane@example.com",
                "username", "jane",
                "password", "password123"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.verificationId").value("verify-1"));
  }

  @Test
  void signupValidationFailureReturnsBadRequest() throws Exception {
    mockMvc.perform(post("/api/auth/signup/request-otp")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(java.util.Map.of(
                "name", "",
                "email", "bad-email",
                "username", "u",
                "password", "123"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.validationErrors").exists())
        .andExpect(jsonPath("$.message").isNotEmpty());
  }

  @Test
  void loginHandlesServiceErrorsWithStructuredPayload() throws Exception {
    when(requestFingerprintService.fingerprint(any())).thenReturn("device-1");
    when(authService.login(any(), any()))
        .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password."));

    mockMvc.perform(post("/api/auth/login")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(java.util.Map.of(
                "identifier", "jane",
                "password", "wrongpass"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("Incorrect password."));
  }

  @Test
  void verifySignupOtpReturnsAuthResponse() throws Exception {
    AuthResponse response = new AuthResponse(
        "u1", "Jane", "jane@example.com", "jane", "2026-04-08T00:00:00Z", "profile_1",
        null, null, null, null, null, null,
        0, 3, 0, 2,
        false, false,
        null, null,
        "token-1");
    when(authService.verifySignUpOtp(any())).thenReturn(response);

    mockMvc.perform(post("/api/auth/signup/verify-otp")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(java.util.Map.of(
                "verificationId", "verify-1",
                "otp", "123456"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("token-1"));
  }
}
