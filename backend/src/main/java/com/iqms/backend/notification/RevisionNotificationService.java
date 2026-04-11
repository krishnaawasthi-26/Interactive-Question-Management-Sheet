package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.CreateAlarmRequest;
import com.iqms.backend.dto.notification.NotificationActionResponse;
import com.iqms.backend.dto.notification.NotificationFilterRequest;
import com.iqms.backend.dto.notification.PushSubscriptionRequest;
import com.iqms.backend.model.PushSubscription;
import com.iqms.backend.model.RevisionNotification;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.notification.support.PlatformNotificationSeedService;
import com.iqms.backend.notification.support.RevisionScheduleService;
import com.iqms.backend.repository.PushSubscriptionRepository;
import com.iqms.backend.repository.RevisionNotificationRepository;
import com.iqms.backend.repository.SheetRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RevisionNotificationService {
  private final RevisionNotificationRepository notificationRepository;
  private final SheetRepository sheetRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final PlatformNotificationSeedService platformSeedService;
  private final RevisionScheduleService revisionScheduleService;

  public RevisionNotificationService(
      RevisionNotificationRepository notificationRepository,
      SheetRepository sheetRepository,
      PushSubscriptionRepository pushSubscriptionRepository,
      PlatformNotificationSeedService platformSeedService,
      RevisionScheduleService revisionScheduleService) {
    this.notificationRepository = notificationRepository;
    this.sheetRepository = sheetRepository;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
    this.platformSeedService = platformSeedService;
    this.revisionScheduleService = revisionScheduleService;
  }

  public List<RevisionNotification> fetchNotifications(String userId, NotificationFilterRequest filter) {
    syncNotificationsFromSheets(userId);
    platformSeedService.seedForUserIfNeeded(userId);
    deliverDueAlarms(userId);

    int size = Math.max(1, Math.min(filter.getSize(), 100));
    int page = Math.max(0, filter.getPage());
    PageRequest pageable = PageRequest.of(page, size);

    List<RevisionNotification> notifications = filter.getType() == null || filter.getType().isBlank()
        ? notificationRepository.findVisibleByUserId(userId, Instant.now(), pageable)
        : notificationRepository.findVisibleByUserIdAndType(userId, filter.getType(), Instant.now(), pageable);

    notifications.forEach(this::refreshDynamicStatusIfNeeded);

    return notifications.stream()
        .filter((item) -> filter.getStatus() == null || filter.getStatus().isBlank() || filter.getStatus().equals(item.getStatus()))
        .sorted(Comparator.comparing(RevisionNotification::getScheduledFor, Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
  }

  public long unreadCount(String userId) {
    syncNotificationsFromSheets(userId);
    platformSeedService.seedForUserIfNeeded(userId);
    deliverDueAlarms(userId);
    return notificationRepository.countVisibleByUserIdAndStatus(userId, "unread", Instant.now());
  }

  public NotificationActionResponse createAlarm(String userId, CreateAlarmRequest body) {
    Instant now = Instant.now();
    RevisionNotification notification = new RevisionNotification();
    notification.setUserId(userId);
    notification.setType("alarm");
    notification.setTitle(body.getTitle());
    notification.setMessage(body.getMessage());
    notification.setPriority(normalizePriority(body.getPriority()));
    notification.setStatus("unread");
    notification.setScheduledFor(body.getScheduledFor());
    notification.setSourceType(defaultText(body.getSourceType(), "manual"));
    notification.setSourceId(body.getSourceId());
    notification.setActionUrl(body.getActionUrl());
    notification.setPersistent(true);
    notification.setCreatedAt(now);
    notification.setUpdatedAt(now);
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public NotificationActionResponse markRead(String userId, String notificationId) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("read");
    notification.setReadAt(Instant.now());
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public NotificationActionResponse markDone(String userId, String notificationId) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("completed");
    notification.setReadAt(Instant.now());
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public NotificationActionResponse dismiss(String userId, String notificationId) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("dismissed");
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public NotificationActionResponse archive(String userId, String notificationId) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("archived");
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public void delete(String userId, String notificationId) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notificationRepository.delete(notification);
  }

  public long markAllRead(String userId) {
    List<RevisionNotification> current = notificationRepository.findVisibleByUserId(userId, Instant.now(), PageRequest.of(0, 500));
    Instant now = Instant.now();
    long affected = 0;
    for (RevisionNotification item : current) {
      if (!"unread".equals(item.getStatus())) continue;
      item.setStatus("read");
      item.setReadAt(now);
      item.setUpdatedAt(now);
      notificationRepository.save(item);
      affected += 1;
    }
    return affected;
  }

  public NotificationActionResponse snooze(String userId, String notificationId, int minutes) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("unread");
    notification.setScheduledFor(Instant.now().plusSeconds((long) minutes * 60));
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public void registerPushSubscription(String userId, PushSubscriptionRequest body) {
    PushSubscription subscription = pushSubscriptionRepository
        .findByUserIdAndEndpoint(userId, body.getEndpoint())
        .orElseGet(PushSubscription::new);

    Instant now = Instant.now();
    if (subscription.getCreatedAt() == null) {
      subscription.setCreatedAt(now);
    }
    subscription.setUserId(userId);
    subscription.setEndpoint(body.getEndpoint());
    subscription.setKeys(body.getKeys());
    subscription.setUpdatedAt(now);
    pushSubscriptionRepository.save(subscription);
  }

  private void syncNotificationsFromSheets(String userId) {
    List<Sheet> sheets = sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId);

    for (Sheet sheet : sheets) {
      for (Map<String, Object> topic : safeList(sheet.getTopics())) {
        String topicTitle = String.valueOf(topic.getOrDefault("title", "Topic"));
        for (Map<String, Object> subTopic : safeList(topic.get("subTopics"))) {
          for (Map<String, Object> question : safeList(subTopic.get("questions"))) {
            List<Instant> revisionTimes = extractRevisionTimes(question);
            String problemId = String.valueOf(question.getOrDefault("id", "unknown"));
            String title = String.valueOf(question.getOrDefault("text", "Untitled problem"));
            for (int i = 0; i < revisionTimes.size(); i++) {
              upsertRevisionNotification(userId, sheet, topicTitle, problemId, title, i + 1, revisionTimes.get(i));
            }
          }
        }
      }
    }
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> safeList(Object value) {
    if (!(value instanceof List<?> rawList)) return List.of();
    List<Map<String, Object>> result = new ArrayList<>();
    for (Object entry : rawList) {
      if (entry instanceof Map<?, ?> map) {
        result.add((Map<String, Object>) map);
      }
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  private List<Instant> extractRevisionTimes(Map<String, Object> question) {
    List<Instant> revisionTimes = new ArrayList<>();
    Object revisionSchedule = question.get("revisionSchedule");
    if (revisionSchedule instanceof List<?> scheduleList) {
      for (Object item : scheduleList) {
        parseInstant(item).ifPresent(revisionTimes::add);
      }
    }

    Object attemptLogRaw = question.get("attemptLog");
    if (attemptLogRaw instanceof Map<?, ?> attemptLog) {
      Object revisionDatesRaw = attemptLog.get("revisionDates");
      if (revisionDatesRaw instanceof List<?> dateList) {
        for (Object item : dateList) {
          parseInstant(item).ifPresent(revisionTimes::add);
        }
      }
      parseInstant(attemptLog.get("revisionDate")).ifPresent(revisionTimes::add);

      if (revisionTimes.isEmpty()) {
        parseInstant(attemptLog.get("updatedAt"))
            .or(() -> parseInstant(attemptLog.get("createdAt")))
            .ifPresent((base) -> revisionTimes.addAll(revisionScheduleService.generateSchedule(base)));
      }
    }

    return revisionTimes.stream().filter(Objects::nonNull).distinct().sorted().toList();
  }

  private java.util.Optional<Instant> parseInstant(Object value) {
    if (value == null) return java.util.Optional.empty();
    try {
      if (value instanceof String text && !text.isBlank()) {
        return java.util.Optional.of(Instant.parse(text));
      }
    } catch (Exception ignored) {
      return java.util.Optional.empty();
    }
    return java.util.Optional.empty();
  }

  private void upsertRevisionNotification(
      String userId,
      Sheet sheet,
      String topicTitle,
      String problemId,
      String title,
      int revisionNumber,
      Instant dueAt) {
    RevisionNotification notification = notificationRepository
        .findRevisionBySource(userId, "revision", "question", sheet.getId() + ":" + problemId, revisionNumber)
        .orElseGet(RevisionNotification::new);

    Instant now = Instant.now();
    if (notification.getCreatedAt() == null) {
      notification.setCreatedAt(now);
      notification.setStatus("unread");
    }

    Map<String, Object> metadata = notification.getMetadata() == null ? new HashMap<>() : notification.getMetadata();
    metadata.put("sheetId", sheet.getId());
    metadata.put("sheetTitle", sheet.getTitle());
    metadata.put("topicTitle", topicTitle);
    metadata.put("problemId", problemId);
    metadata.put("revisionNumber", revisionNumber);

    notification.setUserId(userId);
    notification.setType("revision");
    notification.setSourceType("question");
    notification.setSourceId(sheet.getId() + ":" + problemId);
    notification.setTitle(title);
    notification.setMessage("Revision " + revisionNumber + " is scheduled.");
    notification.setPriority(revisionNumber <= 2 ? "high" : "medium");
    notification.setScheduledFor(dueAt);
    notification.setActionUrl("/app/" + sheet.getId() + "?problemId=" + problemId);
    notification.setMetadata(metadata);
    notification.setPersistent(true);
    refreshDynamicStatusIfNeeded(notification);
    notification.setUpdatedAt(now);

    notificationRepository.save(notification);
  }

  private void refreshDynamicStatusIfNeeded(RevisionNotification notification) {
    if (notification.getScheduledFor() == null) return;
    Instant now = Instant.now();

    if ("completed".equals(notification.getStatus()) || "archived".equals(notification.getStatus()) || "dismissed".equals(notification.getStatus())) {
      return;
    }

    if (notification.getScheduledFor().isBefore(now) && notification.getDeliveredAt() == null) {
      notification.setDeliveredAt(now);
    }

    if (notification.getScheduledFor().isBefore(now) && "read".equals(notification.getStatus())) {
      return;
    }

    if (notification.getScheduledFor().isBefore(now) && "unread".equals(notification.getStatus())) {
      // keep unread; frontend can show as due.
      return;
    }

    if (notification.getScheduledFor().isAfter(now) && notification.getStatus() == null) {
      notification.setStatus("unread");
    }
  }

  private void deliverDueAlarms(String userId) {
    List<RevisionNotification> due = notificationRepository.findAllByUserIdAndTypeAndStatusAndScheduledForBefore(
        userId,
        "alarm",
        "unread",
        Instant.now());

    for (RevisionNotification item : due) {
      if (item.getDeliveredAt() != null) continue;
      item.setDeliveredAt(Instant.now());
      item.setUpdatedAt(Instant.now());
      notificationRepository.save(item);
    }
  }

  private String normalizePriority(String value) {
    if ("low".equals(value) || "high".equals(value)) return value;
    return "medium";
  }

  private String defaultText(String value, String fallback) {
    if (value == null || value.isBlank()) return fallback;
    return value;
  }

  private RevisionNotification getOwnedNotification(String userId, String id) {
    return notificationRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
  }
}
