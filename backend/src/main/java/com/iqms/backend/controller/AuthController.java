package com.iqms.backend.controller;

import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.GoogleAuthRequest;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpInitiateResponse;
import com.iqms.backend.dto.SignUpOtpRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.dto.SignUpResendOtpRequest;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final RequestFingerprintService requestFingerprintService;

  public AuthController(
      AuthService authService,
      RequestFingerprintService requestFingerprintService) {
    this.authService = authService;
    this.requestFingerprintService = requestFingerprintService;
  }

  @PostMapping("/signup")
  public ResponseEntity<SignUpInitiateResponse> signUp(@Valid @RequestBody SignUpRequest request) {
    return ResponseEntity.ok(authService.signUp(request));
  }

  @PostMapping("/signup/resend-otp")
  public ResponseEntity<SignUpInitiateResponse> resendOtp(@Valid @RequestBody SignUpResendOtpRequest request) {
    return ResponseEntity.ok(authService.resendSignupOtp(request.getEmail()));
  }

  @PostMapping("/signup/verify-otp")
  public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody SignUpOtpRequest request) {
    return ResponseEntity.ok(authService.verifySignupOtp(request.getEmail(), request.getOtp()));
  }

  @PostMapping("/google")
  public ResponseEntity<AuthResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
    return ResponseEntity.ok(authService.authenticateWithGoogle(request.getIdToken()));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    String deviceKey = requestFingerprintService.fingerprint(servletRequest);
    return ResponseEntity.ok(authService.login(request, deviceKey));
  }
}
