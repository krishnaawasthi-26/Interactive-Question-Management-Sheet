package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleAuthRequest {

  @NotBlank(message = "Google id token is required")
  private String idToken;

  public String getIdToken() {
    return idToken;
  }

  public void setIdToken(String idToken) {
    this.idToken = idToken;
  }
}
