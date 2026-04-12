package com.iqms.backend.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sheet_activity_events")
public class SheetActivityEvent {
  @Id
  private String id;
  @Indexed
  private String sheetId;
  @Indexed
  private String actorUserId;
  private String eventType;
  private Map<String, Object> metadata = new LinkedHashMap<>();
  private Instant createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getSheetId() { return sheetId; }
  public void setSheetId(String sheetId) { this.sheetId = sheetId; }
  public String getActorUserId() { return actorUserId; }
  public void setActorUserId(String actorUserId) { this.actorUserId = actorUserId; }
  public String getEventType() { return eventType; }
  public void setEventType(String eventType) { this.eventType = eventType; }
  public Map<String, Object> getMetadata() { return metadata; }
  public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
