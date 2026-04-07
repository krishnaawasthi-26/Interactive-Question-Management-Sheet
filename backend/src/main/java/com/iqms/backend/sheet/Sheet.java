package com.iqms.backend.sheet;

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
  private List<String> downloadedByUsernames = new ArrayList<>();
  private List<String> copiedByUsernames = new ArrayList<>();

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
  public boolean isPublic() { return isPublic; }
  public void setPublic(boolean aPublic) { isPublic = aPublic; }
  public boolean isArchived() { return isArchived; }
  public void setArchived(boolean archived) { isArchived = archived; }
  public List<Map<String, Object>> getTopics() { return topics; }
  public void setTopics(List<Map<String, Object>> topics) { this.topics = topics; }
  public List<String> getDownloadedByUsernames() { return downloadedByUsernames; }
  public void setDownloadedByUsernames(List<String> downloadedByUsernames) { this.downloadedByUsernames = downloadedByUsernames; }
  public List<String> getCopiedByUsernames() { return copiedByUsernames; }
  public void setCopiedByUsernames(List<String> copiedByUsernames) { this.copiedByUsernames = copiedByUsernames; }
}
