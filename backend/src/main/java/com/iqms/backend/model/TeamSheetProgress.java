package com.iqms.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "team_sheet_progress")
public class TeamSheetProgress {
  @Id
  private String id;
  @Indexed
  private String teamId;
  @Indexed
  private String sheetId;
  @Indexed
  private String userId;
  private Integer progressPercent;
  private Integer dueCount;
  private Integer overdueRevisionCount;
  private Instant updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTeamId() { return teamId; }
  public void setTeamId(String teamId) { this.teamId = teamId; }
  public String getSheetId() { return sheetId; }
  public void setSheetId(String sheetId) { this.sheetId = sheetId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public Integer getProgressPercent() { return progressPercent; }
  public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
  public Integer getDueCount() { return dueCount; }
  public void setDueCount(Integer dueCount) { this.dueCount = dueCount; }
  public Integer getOverdueRevisionCount() { return overdueRevisionCount; }
  public void setOverdueRevisionCount(Integer overdueRevisionCount) { this.overdueRevisionCount = overdueRevisionCount; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
