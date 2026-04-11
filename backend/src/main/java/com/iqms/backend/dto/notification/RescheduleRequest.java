package com.iqms.backend.dto.notification;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class RescheduleRequest {
  @NotNull
  @Future
  private Instant scheduledFor;

  public Instant getScheduledFor() { return scheduledFor; }
  public void setScheduledFor(Instant scheduledFor) { this.scheduledFor = scheduledFor; }
}
