package com.iqms.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sheet_copy_events")
@CompoundIndex(name = "uniq_source_sheet_copier", def = "{'sourceSheetId': 1, 'copiedByUserId': 1}", unique = true)
public class SheetCopyEvent {
  @Id
  private String id;
  private String sourceSheetId;
  private String sourceOwnerId;
  private String copiedByUserId;
  private String copiedSheetId;
  private Instant copiedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getSourceSheetId() { return sourceSheetId; }
  public void setSourceSheetId(String sourceSheetId) { this.sourceSheetId = sourceSheetId; }
  public String getSourceOwnerId() { return sourceOwnerId; }
  public void setSourceOwnerId(String sourceOwnerId) { this.sourceOwnerId = sourceOwnerId; }
  public String getCopiedByUserId() { return copiedByUserId; }
  public void setCopiedByUserId(String copiedByUserId) { this.copiedByUserId = copiedByUserId; }
  public String getCopiedSheetId() { return copiedSheetId; }
  public void setCopiedSheetId(String copiedSheetId) { this.copiedSheetId = copiedSheetId; }
  public Instant getCopiedAt() { return copiedAt; }
  public void setCopiedAt(Instant copiedAt) { this.copiedAt = copiedAt; }
}
