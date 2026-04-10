package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
  @NotBlank(message = "Google ID token is required")
  private String idToken;

  public String getIdToken() {
    return idToken;
  }

  public void setIdToken(String idToken) {
    this.idToken = idToken;
  }
}
