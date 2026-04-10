package com.iqms.backend.model;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

  @Id
  private String id;

  private String name;

  @Indexed(unique = true)
  private String email;

  @Indexed(unique = true)
  private String username;

  private String password;
  private String authProvider;
  private String googleSubject;

  @Indexed(unique = true)
  private String profileShareId;

  private Instant createdAt;
  private String bio;
  private String institution;
  private String company;
  private String websiteUrl;
  private String githubUrl;
  private String linkedinUrl;
  private Set<String> followerUserIds = new LinkedHashSet<>();
  private Set<String> followingUserIds = new LinkedHashSet<>();
  private Set<String> copiedSheetIds = new LinkedHashSet<>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

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

  public String getAuthProvider() {
    return authProvider;
  }

  public void setAuthProvider(String authProvider) {
    this.authProvider = authProvider;
  }

  public String getGoogleSubject() {
    return googleSubject;
  }

  public void setGoogleSubject(String googleSubject) {
    this.googleSubject = googleSubject;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getProfileShareId() {
    return profileShareId;
  }

  public void setProfileShareId(String profileShareId) {
    this.profileShareId = profileShareId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public String getBio() {
    return bio;
  }

  public void setBio(String bio) {
    this.bio = bio;
  }

  public String getInstitution() {
    return institution;
  }

  public void setInstitution(String institution) {
    this.institution = institution;
  }

  public String getCompany() {
    return company;
  }

  public void setCompany(String company) {
    this.company = company;
  }

  public String getWebsiteUrl() {
    return websiteUrl;
  }

  public void setWebsiteUrl(String websiteUrl) {
    this.websiteUrl = websiteUrl;
  }

  public String getGithubUrl() {
    return githubUrl;
  }

  public void setGithubUrl(String githubUrl) {
    this.githubUrl = githubUrl;
  }

  public String getLinkedinUrl() {
    return linkedinUrl;
  }

  public void setLinkedinUrl(String linkedinUrl) {
    this.linkedinUrl = linkedinUrl;
  }

  public Set<String> getFollowerUserIds() {
    return followerUserIds;
  }

  public void setFollowerUserIds(Set<String> followerUserIds) {
    this.followerUserIds = followerUserIds == null ? new LinkedHashSet<>() : new LinkedHashSet<>(followerUserIds);
  }

  public Set<String> getFollowingUserIds() {
    return followingUserIds;
  }

  public void setFollowingUserIds(Set<String> followingUserIds) {
    this.followingUserIds = followingUserIds == null ? new LinkedHashSet<>() : new LinkedHashSet<>(followingUserIds);
  }

  public Set<String> getCopiedSheetIds() {
    return copiedSheetIds;
  }

  public void setCopiedSheetIds(Set<String> copiedSheetIds) {
    this.copiedSheetIds = copiedSheetIds == null ? new LinkedHashSet<>() : new LinkedHashSet<>(copiedSheetIds);
  }
}
