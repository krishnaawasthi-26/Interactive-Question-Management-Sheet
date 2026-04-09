package com.iqms.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "revision_notifications")
@CompoundIndexes({
    @CompoundIndex(name = "user_revision_unique", def = "{'userId': 1, 'sheetId': 1, 'problemId': 1, 'revisionNumber': 1}", unique = true)
})
public class RevisionNotification {
  @Id
  private String id;

  @Indexed
  private String userId;
  @Indexed
  private String sheetId;
  private String problemId;

  private String title;
  private String message;
  private String sheetTitle;
  private int revisionNumber;
  private Instant dueAt;
  private String status;
  private Instant readAt;
  private Instant completedAt;
  private Instant snoozedUntil;
  private String link;
  private Instant createdAt;
  private Instant updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getSheetId() { return sheetId; }
  public void setSheetId(String sheetId) { this.sheetId = sheetId; }
  public String getProblemId() { return problemId; }
  public void setProblemId(String problemId) { this.problemId = problemId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public String getSheetTitle() { return sheetTitle; }
  public void setSheetTitle(String sheetTitle) { this.sheetTitle = sheetTitle; }
  public int getRevisionNumber() { return revisionNumber; }
  public void setRevisionNumber(int revisionNumber) { this.revisionNumber = revisionNumber; }
  public Instant getDueAt() { return dueAt; }
  public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getReadAt() { return readAt; }
  public void setReadAt(Instant readAt) { this.readAt = readAt; }
  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
  public Instant getSnoozedUntil() { return snoozedUntil; }
  public void setSnoozedUntil(Instant snoozedUntil) { this.snoozedUntil = snoozedUntil; }
  public String getLink() { return link; }
  public void setLink(String link) { this.link = link; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
