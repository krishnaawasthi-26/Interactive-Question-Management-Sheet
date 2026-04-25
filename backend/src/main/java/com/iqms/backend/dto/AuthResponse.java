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
  private Integer usernameChangesUsed;
  private Integer usernameChangesRemaining;
  private Integer emailChangesUsed;
  private Integer emailChangesRemaining;
  private Boolean premiumActive;
  private String premiumAccessType;
  private String premiumUntil;
  private String premiumPlan;
  private String premiumExpiresAt;
  private String premiumTrialStartedAt;
  private String premiumTrialEndsAt;
  private String premiumGrantedReason;
  private Boolean hadFreePremiumTrial;
  private Boolean showPremiumTrialWelcomePopup;
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
      Integer usernameChangesUsed,
      Integer usernameChangesRemaining,
      Integer emailChangesUsed,
      Integer emailChangesRemaining,
      Boolean premiumActive,
      String premiumAccessType,
      String premiumUntil,
      String premiumPlan,
      String premiumExpiresAt,
      String premiumTrialStartedAt,
      String premiumTrialEndsAt,
      String premiumGrantedReason,
      Boolean hadFreePremiumTrial,
      Boolean showPremiumTrialWelcomePopup,
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
    this.usernameChangesUsed = usernameChangesUsed;
    this.usernameChangesRemaining = usernameChangesRemaining;
    this.emailChangesUsed = emailChangesUsed;
    this.emailChangesRemaining = emailChangesRemaining;
    this.premiumActive = premiumActive;
    this.premiumAccessType = premiumAccessType;
    this.premiumUntil = premiumUntil;
    this.premiumPlan = premiumPlan;
    this.premiumExpiresAt = premiumExpiresAt;
    this.premiumTrialStartedAt = premiumTrialStartedAt;
    this.premiumTrialEndsAt = premiumTrialEndsAt;
    this.premiumGrantedReason = premiumGrantedReason;
    this.hadFreePremiumTrial = hadFreePremiumTrial;
    this.showPremiumTrialWelcomePopup = showPremiumTrialWelcomePopup;
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
  public Integer getUsernameChangesUsed() { return usernameChangesUsed; }
  public Integer getUsernameChangesRemaining() { return usernameChangesRemaining; }
  public Integer getEmailChangesUsed() { return emailChangesUsed; }
  public Integer getEmailChangesRemaining() { return emailChangesRemaining; }
  public Boolean getPremiumActive() { return premiumActive; }
  public String getPremiumAccessType() { return premiumAccessType; }
  public String getPremiumUntil() { return premiumUntil; }
  public String getPremiumPlan() { return premiumPlan; }
  public String getPremiumExpiresAt() { return premiumExpiresAt; }
  public String getPremiumTrialStartedAt() { return premiumTrialStartedAt; }
  public String getPremiumTrialEndsAt() { return premiumTrialEndsAt; }
  public String getPremiumGrantedReason() { return premiumGrantedReason; }
  public Boolean getHadFreePremiumTrial() { return hadFreePremiumTrial; }
  public Boolean getShowPremiumTrialWelcomePopup() { return showPremiumTrialWelcomePopup; }
  public String getToken() { return token; }
}
