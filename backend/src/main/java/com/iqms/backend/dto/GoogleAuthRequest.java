package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleAuthRequest {

  // This endpoint accepts only Google Identity Services credential JWT tokens.
  // OAuth authorization-code flow is intentionally not used in this API.
  @NotBlank(message = "Google id token is required")
  private String idToken;

  public String getIdToken() {
    return idToken;
  }

  public void setIdToken(String idToken) {
    this.idToken = idToken == null ? null : idToken.trim();
  }
}
