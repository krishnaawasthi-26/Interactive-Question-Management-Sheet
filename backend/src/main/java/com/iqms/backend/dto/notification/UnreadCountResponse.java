package com.iqms.backend.dto.notification;

public class UnreadCountResponse {
  private final long unreadCount;

  public UnreadCountResponse(long unreadCount) {
    this.unreadCount = unreadCount;
  }

  public long getUnreadCount() { return unreadCount; }
}
