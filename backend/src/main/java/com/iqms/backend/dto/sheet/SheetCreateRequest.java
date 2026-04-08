package com.iqms.backend.dto.sheet;

import jakarta.validation.constraints.Size;

public class SheetCreateRequest {

  @Size(max = 120, message = "Title must be 120 characters or fewer")
  private String title;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }
}
