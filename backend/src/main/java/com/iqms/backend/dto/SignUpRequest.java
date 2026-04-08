package com.iqms.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SignUpRequest {

  @NotBlank(message = "Name is required")
  @Size(max = 80, message = "Name must be 80 characters or fewer")
  private String name;

  @NotBlank(message = "Email is required")
  @Email(message = "Invalid email format")
  @Size(max = 120, message = "Email must be 120 characters or fewer")
  private String email;

  @NotBlank(message = "Username is required")
  @Size(min = 3, max = 30, message = "Username must be 3-30 characters")
  @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only use letters, numbers, _ and -")
  private String username;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
  private String password;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }
}
