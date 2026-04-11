package com.iqms.backend.dto.notification;

public class NotificationFilterRequest {
  private String type;
  private String status;
  private int page = 0;
  private int size = 40;

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getPage() { return page; }
  public void setPage(int page) { this.page = page; }
  public int getSize() { return size; }
  public void setSize(int size) { this.size = size; }
}
