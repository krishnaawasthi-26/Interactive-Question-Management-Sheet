package com.iqms.backend.notification.support;

import com.iqms.backend.model.RevisionNotification;
import com.iqms.backend.repository.RevisionNotificationRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PlatformNotificationSeedService {
  private final RevisionNotificationRepository notificationRepository;

  public PlatformNotificationSeedService(RevisionNotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  public void seedForUserIfNeeded(String userId) {
    if (notificationRepository.existsByUserIdAndSourceTypeAndSourceId(userId, "system", "platform-seed")) {
      return;
    }

    create(userId, "Welcome to smarter revisions", "Set reminders, track revisions, and stay consistent.", "medium", 30);
    create(userId, "New reminder presets", "Use quick presets like 1h, 2h, tonight, and tomorrow morning.", "low", 15);
  }

  private void create(String userId, String title, String message, String priority, int expireDays) {
    RevisionNotification notification = new RevisionNotification();
    Instant now = Instant.now();
    Map<String, Object> metadata = new HashMap<>();
    metadata.put("seeded", true);
    notification.setUserId(userId);
    notification.setType("platform");
    notification.setTitle(title);
    notification.setMessage(message);
    notification.setStatus("unread");
    notification.setPriority(priority);
    notification.setSourceType("system");
    notification.setSourceId("platform-seed");
    notification.setActionUrl("/premium");
    notification.setScheduledFor(now);
    notification.setDeliveredAt(now);
    notification.setPersistent(false);
    notification.setExpiresAt(now.plus(expireDays, ChronoUnit.DAYS));
    notification.setMetadata(metadata);
    notification.setCreatedAt(now);
    notification.setUpdatedAt(now);
    notificationRepository.save(notification);
  }
}
