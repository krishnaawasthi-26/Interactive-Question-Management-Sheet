package com.iqms.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notification_preferences")
public class NotificationPreferences {
  @Id
  private String id;

  @Indexed(unique = true)
  private String userId;

  private boolean platformEnabled = true;
  private boolean revisionEnabled = true;
  private boolean alarmEnabled = true;
  private boolean browserNotificationsEnabled = false;
  private boolean streakProtectionEnabled = true;
  private boolean weakTopicAlertsEnabled = true;
  private String digestFrequency = "daily";
  private Integer quietHoursStart;
  private Integer quietHoursEnd;
  private List<Integer> revisionIntervalsHours = new ArrayList<>(List.of(6, 24, 72, 168));
  private Integer defaultSnoozeMinutes = 30;
  private Instant createdAt;
  private Instant updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public boolean isPlatformEnabled() { return platformEnabled; }
  public void setPlatformEnabled(boolean platformEnabled) { this.platformEnabled = platformEnabled; }
  public boolean isRevisionEnabled() { return revisionEnabled; }
  public void setRevisionEnabled(boolean revisionEnabled) { this.revisionEnabled = revisionEnabled; }
  public boolean isAlarmEnabled() { return alarmEnabled; }
  public void setAlarmEnabled(boolean alarmEnabled) { this.alarmEnabled = alarmEnabled; }
  public boolean isBrowserNotificationsEnabled() { return browserNotificationsEnabled; }
  public void setBrowserNotificationsEnabled(boolean browserNotificationsEnabled) { this.browserNotificationsEnabled = browserNotificationsEnabled; }
  public boolean isStreakProtectionEnabled() { return streakProtectionEnabled; }
  public void setStreakProtectionEnabled(boolean streakProtectionEnabled) { this.streakProtectionEnabled = streakProtectionEnabled; }
  public boolean isWeakTopicAlertsEnabled() { return weakTopicAlertsEnabled; }
  public void setWeakTopicAlertsEnabled(boolean weakTopicAlertsEnabled) { this.weakTopicAlertsEnabled = weakTopicAlertsEnabled; }
  public String getDigestFrequency() { return digestFrequency; }
  public void setDigestFrequency(String digestFrequency) { this.digestFrequency = digestFrequency; }
  public Integer getQuietHoursStart() { return quietHoursStart; }
  public void setQuietHoursStart(Integer quietHoursStart) { this.quietHoursStart = quietHoursStart; }
  public Integer getQuietHoursEnd() { return quietHoursEnd; }
  public void setQuietHoursEnd(Integer quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }
  public List<Integer> getRevisionIntervalsHours() { return revisionIntervalsHours; }
  public void setRevisionIntervalsHours(List<Integer> revisionIntervalsHours) { this.revisionIntervalsHours = revisionIntervalsHours; }
  public Integer getDefaultSnoozeMinutes() { return defaultSnoozeMinutes; }
  public void setDefaultSnoozeMinutes(Integer defaultSnoozeMinutes) { this.defaultSnoozeMinutes = defaultSnoozeMinutes; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
