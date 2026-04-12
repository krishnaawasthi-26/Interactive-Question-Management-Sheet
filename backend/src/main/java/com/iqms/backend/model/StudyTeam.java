package com.iqms.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "study_teams")
public class StudyTeam {
  @Id
  private String id;
  @Indexed
  private String ownerUserId;
  private String name;
  private String description;
  private String mode;
  private Instant createdAt;
  private Instant updatedAt;
  private List<Membership> memberships = new ArrayList<>();
  private List<String> assignedSheetIds = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getOwnerUserId() { return ownerUserId; }
  public void setOwnerUserId(String ownerUserId) { this.ownerUserId = ownerUserId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getMode() { return mode; }
  public void setMode(String mode) { this.mode = mode; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public List<Membership> getMemberships() { return memberships; }
  public void setMemberships(List<Membership> memberships) { this.memberships = memberships; }
  public List<String> getAssignedSheetIds() { return assignedSheetIds; }
  public void setAssignedSheetIds(List<String> assignedSheetIds) { this.assignedSheetIds = assignedSheetIds; }

  public static class Membership {
    private String userId;
    private String role;
    private Instant joinedAt;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
  }
}
