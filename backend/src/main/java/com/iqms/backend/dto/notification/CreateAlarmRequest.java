package com.iqms.backend.dto.notification;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;

public class CreateAlarmRequest {
  @NotBlank
  private String title;

  @NotBlank
  private String message;

  @NotNull
  @Future
  private Instant scheduledFor;

  private String priority = "medium";
  private String sourceType = "manual";
  private String sourceId;
  private String actionUrl;
  private Map<String, Object> recurrence;

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public Instant getScheduledFor() { return scheduledFor; }
  public void setScheduledFor(Instant scheduledFor) { this.scheduledFor = scheduledFor; }
  public String getPriority() { return priority; }
  public void setPriority(String priority) { this.priority = priority; }
  public String getSourceType() { return sourceType; }
  public void setSourceType(String sourceType) { this.sourceType = sourceType; }
  public String getSourceId() { return sourceId; }
  public void setSourceId(String sourceId) { this.sourceId = sourceId; }
  public String getActionUrl() { return actionUrl; }
  public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
  public Map<String, Object> getRecurrence() { return recurrence; }
  public void setRecurrence(Map<String, Object> recurrence) { this.recurrence = recurrence; }
}
