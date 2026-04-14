package com.iqms.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "user_source_revision_unique", def = "{'userId': 1, 'type': 1, 'sourceType': 1, 'sourceId': 1, 'metadata.revisionNumber': 1}", unique = true, sparse = true)
})
public class RevisionNotification {
  @Id
  private String id;

  @Indexed
  private String userId;

  @Indexed
  private String type; // platform | revision | alarm

  private String title;
  private String message;
  @Indexed
  private String status; // unread | read | archived | dismissed | completed | overdue | deleted
  private String priority; // low | medium | high

  private Instant scheduledFor;
  private Instant deliveredAt;
  private Instant readAt;
  private Instant completedAt;
  private Instant snoozedUntil;

  private String sourceType; // sheet | topic | question | system | manual | goal | streak
  private String sourceId;
  private String actionUrl;
  private Map<String, Object> metadata = new HashMap<>();

  private boolean isPersistent;
  private Instant expiresAt;
  private Map<String, Object> recurrence;
  private List<Map<String, Object>> auditTrail = new ArrayList<>();

  private Instant createdAt;
  private Instant updatedAt;
  private Instant deletedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getPriority() { return priority; }
  public void setPriority(String priority) { this.priority = priority; }
  public Instant getScheduledFor() { return scheduledFor; }
  public void setScheduledFor(Instant scheduledFor) { this.scheduledFor = scheduledFor; }
  public Instant getDeliveredAt() { return deliveredAt; }
  public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }
  public Instant getReadAt() { return readAt; }
  public void setReadAt(Instant readAt) { this.readAt = readAt; }
  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
  public Instant getSnoozedUntil() { return snoozedUntil; }
  public void setSnoozedUntil(Instant snoozedUntil) { this.snoozedUntil = snoozedUntil; }
  public String getSourceType() { return sourceType; }
  public void setSourceType(String sourceType) { this.sourceType = sourceType; }
  public String getSourceId() { return sourceId; }
  public void setSourceId(String sourceId) { this.sourceId = sourceId; }
  public String getActionUrl() { return actionUrl; }
  public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
  public Map<String, Object> getMetadata() { return metadata; }
  public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
  public boolean isPersistent() { return isPersistent; }
  public void setPersistent(boolean persistent) { isPersistent = persistent; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Map<String, Object> getRecurrence() { return recurrence; }
  public void setRecurrence(Map<String, Object> recurrence) { this.recurrence = recurrence; }
  public List<Map<String, Object>> getAuditTrail() { return auditTrail; }
  public void setAuditTrail(List<Map<String, Object>> auditTrail) { this.auditTrail = auditTrail; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public Instant getDeletedAt() { return deletedAt; }
  public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
