package com.iqms.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sheet_comments")
public class SheetComment {
  @Id
  private String id;
  @Indexed
  private String sheetId;
  @Indexed
  private String authorUserId;
  private String topicId;
  private String subTopicId;
  private String questionId;
  private String content;
  private Instant createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getSheetId() { return sheetId; }
  public void setSheetId(String sheetId) { this.sheetId = sheetId; }
  public String getAuthorUserId() { return authorUserId; }
  public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }
  public String getTopicId() { return topicId; }
  public void setTopicId(String topicId) { this.topicId = topicId; }
  public String getSubTopicId() { return subTopicId; }
  public void setSubTopicId(String subTopicId) { this.subTopicId = subTopicId; }
  public String getQuestionId() { return questionId; }
  public void setQuestionId(String questionId) { this.questionId = questionId; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
