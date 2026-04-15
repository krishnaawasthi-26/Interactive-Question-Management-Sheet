package com.iqms.backend.controller;

import com.iqms.backend.config.properties.GoogleOAuthProperties;
import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.GoogleAuthConfigResponse;
import com.iqms.backend.dto.GoogleLoginRequest;
import com.iqms.backend.dto.OtpChallengeResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.dto.VerifyOtpRequest;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final RequestFingerprintService requestFingerprintService;
  private final GoogleOAuthProperties googleOAuthProperties;

  public AuthController(
      AuthService authService,
      RequestFingerprintService requestFingerprintService,
      GoogleOAuthProperties googleOAuthProperties) {
    this.authService = authService;
    this.requestFingerprintService = requestFingerprintService;
    this.googleOAuthProperties = googleOAuthProperties;
  }

  @PostMapping("/signup/request-otp")
  public ResponseEntity<OtpChallengeResponse> requestSignUpOtp(@Valid @RequestBody SignUpRequest request) {
    return ResponseEntity.ok(authService.requestSignUpOtp(request));
  }

  @PostMapping("/signup")
  public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
    return ResponseEntity.ok(authService.signUp(request));
  }

  @PostMapping("/signup/verify-otp")
  public ResponseEntity<AuthResponse> verifySignUpOtp(@Valid @RequestBody VerifyOtpRequest request) {
    return ResponseEntity.ok(authService.verifySignUpOtp(request));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    String deviceKey = requestFingerprintService.fingerprint(servletRequest);
    return ResponseEntity.ok(authService.login(request, deviceKey));
  }


  @GetMapping("/google/config")
  public ResponseEntity<GoogleAuthConfigResponse> googleConfig() {
    return ResponseEntity.ok(new GoogleAuthConfigResponse(googleOAuthProperties.getPrimaryClientId()));
  }

  @PostMapping("/google")
  public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
    return ResponseEntity.ok(authService.loginWithGoogle(request));
  }
}
