package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.NotificationPreferencesUpdateRequest;
import com.iqms.backend.model.NotificationPreferences;
import com.iqms.backend.repository.NotificationPreferencesRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificationPreferencesService {
  private final NotificationPreferencesRepository repository;

  public NotificationPreferencesService(NotificationPreferencesRepository repository) {
    this.repository = repository;
  }

  public NotificationPreferences getForUser(String userId) {
    return repository.findByUserId(userId).orElseGet(() -> createDefaults(userId));
  }

  public NotificationPreferences updateForUser(String userId, NotificationPreferencesUpdateRequest request) {
    NotificationPreferences preferences = getForUser(userId);

    if (request.getPlatformEnabled() != null) preferences.setPlatformEnabled(request.getPlatformEnabled());
    if (request.getRevisionEnabled() != null) preferences.setRevisionEnabled(request.getRevisionEnabled());
    if (request.getAlarmEnabled() != null) preferences.setAlarmEnabled(request.getAlarmEnabled());
    if (request.getBrowserNotificationsEnabled() != null) preferences.setBrowserNotificationsEnabled(request.getBrowserNotificationsEnabled());
    if (request.getStreakProtectionEnabled() != null) preferences.setStreakProtectionEnabled(request.getStreakProtectionEnabled());
    if (request.getWeakTopicAlertsEnabled() != null) preferences.setWeakTopicAlertsEnabled(request.getWeakTopicAlertsEnabled());
    if (request.getDigestFrequency() != null && !request.getDigestFrequency().isBlank()) preferences.setDigestFrequency(request.getDigestFrequency());
    if (request.getQuietHoursStart() != null) preferences.setQuietHoursStart(clampHour(request.getQuietHoursStart()));
    if (request.getQuietHoursEnd() != null) preferences.setQuietHoursEnd(clampHour(request.getQuietHoursEnd()));
    if (request.getDefaultSnoozeMinutes() != null) preferences.setDefaultSnoozeMinutes(Math.max(5, Math.min(1440, request.getDefaultSnoozeMinutes())));
    if (request.getRevisionIntervalsHours() != null && !request.getRevisionIntervalsHours().isEmpty()) {
      List<Integer> normalized = request.getRevisionIntervalsHours().stream().map((value) -> Math.max(1, Math.min(24 * 30, value))).distinct().sorted().toList();
      preferences.setRevisionIntervalsHours(normalized);
    }

    preferences.setUpdatedAt(Instant.now());
    return repository.save(preferences);
  }

  private NotificationPreferences createDefaults(String userId) {
    NotificationPreferences preferences = new NotificationPreferences();
    preferences.setUserId(userId);
    preferences.setCreatedAt(Instant.now());
    preferences.setUpdatedAt(Instant.now());
    return repository.save(preferences);
  }

  private int clampHour(int value) {
    return Math.max(0, Math.min(23, value));
  }
}
