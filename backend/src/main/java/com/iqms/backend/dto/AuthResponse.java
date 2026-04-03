package com.iqms.backend.dto;

public class AuthResponse {
  private String id;
  private String name;
  private String email;
  private String username;
  private String createdAt;
  private String profileShareId;
  private String token;

  public AuthResponse(String id, String name, String email, String username, String createdAt, String profileShareId, String token) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.username = username;
    this.createdAt = createdAt;
    this.profileShareId = profileShareId;
    this.token = token;
  }

  public String getId() { return id; }
  public String getName() { return name; }
  public String getEmail() { return email; }
  public String getUsername() { return username; }
  public String getCreatedAt() { return createdAt; }
  public String getProfileShareId() { return profileShareId; }
  public String getToken() { return token; }
}
