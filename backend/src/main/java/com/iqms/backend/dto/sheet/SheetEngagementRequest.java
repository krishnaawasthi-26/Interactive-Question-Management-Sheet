package com.iqms.backend.dto.sheet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SheetEngagementRequest {

  @NotBlank(message = "Action is required")
  @Pattern(regexp = "^(download|copy)$", message = "Action must be either 'download' or 'copy'")
  private String action;

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }
}
