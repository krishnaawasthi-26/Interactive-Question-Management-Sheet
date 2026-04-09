package com.iqms.backend.dto.notification;

public class NotificationActionResponse {
  private final String id;
  private final String status;

  public NotificationActionResponse(String id, String status) {
    this.id = id;
    this.status = status;
  }

  public String getId() { return id; }
  public String getStatus() { return status; }
}
