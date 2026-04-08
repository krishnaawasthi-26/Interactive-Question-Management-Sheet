package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

  @NotBlank(message = "Username or email is required")
  @Size(max = 120, message = "Identifier is too long")
  private String identifier;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
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
