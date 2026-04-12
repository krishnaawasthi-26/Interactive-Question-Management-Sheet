package com.iqms.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sheets")
public class Sheet {
  @Id
  private String id;

  @Indexed
  private String ownerId;

  private String title;

  @Indexed(unique = true)
  private String shareId;

  private Instant createdAt;
  private Instant updatedAt;
  private boolean isPublic;
  private boolean isArchived;
  private String visibility = "private";
  private boolean commentsEnabled = true;
  private String parentSheetId;
  private String remixSourceOwnerId;
  private List<String> downloadedByUsernames = new ArrayList<>();
  private List<String> copiedByUsernames = new ArrayList<>();
  private List<Collaborator> collaborators = new ArrayList<>();

  private List<Map<String, Object>> topics = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getOwnerId() { return ownerId; }
  public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getShareId() { return shareId; }
  public void setShareId(String shareId) { this.shareId = shareId; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  @JsonProperty("isPublic")
  public boolean isPublic() { return isPublic; }
  @JsonProperty("isPublic")
  public void setPublic(boolean aPublic) { isPublic = aPublic; }
  @JsonProperty("isArchived")
  public boolean isArchived() { return isArchived; }
  @JsonProperty("isArchived")
  public void setArchived(boolean archived) { isArchived = archived; }
  public List<Map<String, Object>> getTopics() { return topics; }
  public void setTopics(List<Map<String, Object>> topics) { this.topics = topics; }
  public List<String> getDownloadedByUsernames() { return downloadedByUsernames; }
  public void setDownloadedByUsernames(List<String> downloadedByUsernames) { this.downloadedByUsernames = downloadedByUsernames; }
  public List<String> getCopiedByUsernames() { return copiedByUsernames; }
  public void setCopiedByUsernames(List<String> copiedByUsernames) { this.copiedByUsernames = copiedByUsernames; }
  public String getVisibility() { return visibility; }
  public void setVisibility(String visibility) { this.visibility = visibility; }
  public boolean isCommentsEnabled() { return commentsEnabled; }
  public void setCommentsEnabled(boolean commentsEnabled) { this.commentsEnabled = commentsEnabled; }
  public String getParentSheetId() { return parentSheetId; }
  public void setParentSheetId(String parentSheetId) { this.parentSheetId = parentSheetId; }
  public String getRemixSourceOwnerId() { return remixSourceOwnerId; }
  public void setRemixSourceOwnerId(String remixSourceOwnerId) { this.remixSourceOwnerId = remixSourceOwnerId; }
  public List<Collaborator> getCollaborators() { return collaborators; }
  public void setCollaborators(List<Collaborator> collaborators) { this.collaborators = collaborators == null ? new ArrayList<>() : collaborators; }

  public static class Collaborator {
    private String userId;
    private String role;
    private Instant invitedAt;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }
  }
}
