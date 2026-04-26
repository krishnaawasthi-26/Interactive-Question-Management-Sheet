package com.iqms.backend.dto.sheet;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public class SheetUpdateRequest {

  @Size(max = 120, message = "Title must be 120 characters or fewer")
  private String title;

  private List<Map<String, Object>> topics;
  private List<Map<String, Object>> topicTags;
  private List<Map<String, Object>> userCustomTopics;
  private Boolean isPublic;
  private Boolean isArchived;
  private Boolean shareProgress;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public List<Map<String, Object>> getTopics() {
    return topics;
  }

  public void setTopics(List<Map<String, Object>> topics) {
    this.topics = topics;
  }

  public Boolean getIsPublic() {
    return isPublic;
  }

  public void setIsPublic(Boolean isPublic) {
    this.isPublic = isPublic;
  }

  public Boolean getIsArchived() {
    return isArchived;
  }

  public void setIsArchived(Boolean isArchived) {
    this.isArchived = isArchived;
  }

  public Boolean getShareProgress() {
    return shareProgress;
  }

  public void setShareProgress(Boolean shareProgress) {
    this.shareProgress = shareProgress;
  }

  public List<Map<String, Object>> getTopicTags() {
    return topicTags;
  }

  public void setTopicTags(List<Map<String, Object>> topicTags) {
    this.topicTags = topicTags;
  }

  public List<Map<String, Object>> getUserCustomTopics() {
    return userCustomTopics;
  }

  public void setUserCustomTopics(List<Map<String, Object>> userCustomTopics) {
    this.userCustomTopics = userCustomTopics;
  }
}
