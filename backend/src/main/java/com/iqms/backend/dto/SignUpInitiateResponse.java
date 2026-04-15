package com.iqms.backend.dto;

public class SignUpInitiateResponse {
  private final String message;
  private final String email;
  private final long resendAvailableInSeconds;

  public SignUpInitiateResponse(String message, String email, long resendAvailableInSeconds) {
    this.message = message;
    this.email = email;
    this.resendAvailableInSeconds = resendAvailableInSeconds;
  }

  public String getMessage() {
    return message;
  }

  public String getEmail() {
    return email;
  }

  public long getResendAvailableInSeconds() {
    return resendAvailableInSeconds;
  }
}
