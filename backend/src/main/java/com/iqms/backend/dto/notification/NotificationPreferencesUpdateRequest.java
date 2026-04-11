package com.iqms.backend.dto.notification;

import java.util.List;

public class NotificationPreferencesUpdateRequest {
  private Boolean platformEnabled;
  private Boolean revisionEnabled;
  private Boolean alarmEnabled;
  private Boolean browserNotificationsEnabled;
  private Boolean streakProtectionEnabled;
  private Boolean weakTopicAlertsEnabled;
  private String digestFrequency;
  private Integer quietHoursStart;
  private Integer quietHoursEnd;
  private List<Integer> revisionIntervalsHours;
  private Integer defaultSnoozeMinutes;

  public Boolean getPlatformEnabled() { return platformEnabled; }
  public void setPlatformEnabled(Boolean platformEnabled) { this.platformEnabled = platformEnabled; }
  public Boolean getRevisionEnabled() { return revisionEnabled; }
  public void setRevisionEnabled(Boolean revisionEnabled) { this.revisionEnabled = revisionEnabled; }
  public Boolean getAlarmEnabled() { return alarmEnabled; }
  public void setAlarmEnabled(Boolean alarmEnabled) { this.alarmEnabled = alarmEnabled; }
  public Boolean getBrowserNotificationsEnabled() { return browserNotificationsEnabled; }
  public void setBrowserNotificationsEnabled(Boolean browserNotificationsEnabled) { this.browserNotificationsEnabled = browserNotificationsEnabled; }
  public Boolean getStreakProtectionEnabled() { return streakProtectionEnabled; }
  public void setStreakProtectionEnabled(Boolean streakProtectionEnabled) { this.streakProtectionEnabled = streakProtectionEnabled; }
  public Boolean getWeakTopicAlertsEnabled() { return weakTopicAlertsEnabled; }
  public void setWeakTopicAlertsEnabled(Boolean weakTopicAlertsEnabled) { this.weakTopicAlertsEnabled = weakTopicAlertsEnabled; }
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
}
