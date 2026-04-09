package com.iqms.backend.dto.notification;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class SnoozeRequest {
  @Min(5)
  @Max(1440)
  private int minutes = 30;

  public int getMinutes() { return minutes; }
  public void setMinutes(int minutes) { this.minutes = minutes; }
}
