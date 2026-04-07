package com.iqms.backend.dto;

public class AuthResponse {
  private String id;
  private String name;
  private String email;
  private String username;
  private String createdAt;
  private String profileShareId;
  private String bio;
  private String institution;
  private String company;
  private String websiteUrl;
  private String githubUrl;
  private String linkedinUrl;
  private String token;

  public AuthResponse(
      String id,
      String name,
      String email,
      String username,
      String createdAt,
      String profileShareId,
      String bio,
      String institution,
      String company,
      String websiteUrl,
      String githubUrl,
      String linkedinUrl,
      String token) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.username = username;
    this.createdAt = createdAt;
    this.profileShareId = profileShareId;
    this.bio = bio;
    this.institution = institution;
    this.company = company;
    this.websiteUrl = websiteUrl;
    this.githubUrl = githubUrl;
    this.linkedinUrl = linkedinUrl;
    this.token = token;
  }

  public String getId() { return id; }
  public String getName() { return name; }
  public String getEmail() { return email; }
  public String getUsername() { return username; }
  public String getCreatedAt() { return createdAt; }
  public String getProfileShareId() { return profileShareId; }
  public String getBio() { return bio; }
  public String getInstitution() { return institution; }
  public String getCompany() { return company; }
  public String getWebsiteUrl() { return websiteUrl; }
  public String getGithubUrl() { return githubUrl; }
  public String getLinkedinUrl() { return linkedinUrl; }
  public String getToken() { return token; }
}
