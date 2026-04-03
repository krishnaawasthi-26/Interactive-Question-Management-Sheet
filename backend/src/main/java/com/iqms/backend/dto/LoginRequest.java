package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

  @NotBlank(message = "Username or email is required")
  private String identifier;

  @NotBlank(message = "Password is required")
  private String password;

  public String getIdentifier() {
    return identifier;
  }

  public void setIdentifier(String identifier) {
    this.identifier = identifier;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
