package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.NotificationActionResponse;
import com.iqms.backend.dto.notification.PushSubscriptionRequest;
import com.iqms.backend.model.PushSubscription;
import com.iqms.backend.model.RevisionNotification;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.repository.PushSubscriptionRepository;
import com.iqms.backend.repository.RevisionNotificationRepository;
import com.iqms.backend.repository.SheetRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RevisionNotificationService {
  private static final List<String> UNREAD_STATUSES = List.of("pending", "due", "snoozed");

  private final RevisionNotificationRepository notificationRepository;
  private final SheetRepository sheetRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;

  public RevisionNotificationService(
      RevisionNotificationRepository notificationRepository,
      SheetRepository sheetRepository,
      PushSubscriptionRepository pushSubscriptionRepository) {
    this.notificationRepository = notificationRepository;
    this.sheetRepository = sheetRepository;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
  }

  public List<RevisionNotification> fetchNotifications(String userId) {
    syncNotificationsFromSheets(userId);
    List<RevisionNotification> notifications = notificationRepository.findAllByUserIdOrderByDueAtAsc(userId);
    notifications.forEach(this::refreshDueStatusIfNeeded);
    notifications.sort(Comparator.comparing(RevisionNotification::getDueAt, Comparator.nullsLast(Comparator.naturalOrder())));
    return notifications;
  }

  public long unreadCount(String userId) {
    syncNotificationsFromSheets(userId);
    return notificationRepository.countByUserIdAndStatusIn(userId, UNREAD_STATUSES);
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
    notification.setCompletedAt(Instant.now());
    notification.setReadAt(Instant.now());
    notification.setUpdatedAt(Instant.now());
    notificationRepository.save(notification);
    return new NotificationActionResponse(notification.getId(), notification.getStatus());
  }

  public NotificationActionResponse snooze(String userId, String notificationId, int minutes) {
    RevisionNotification notification = getOwnedNotification(userId, notificationId);
    notification.setStatus("snoozed");
    notification.setSnoozedUntil(Instant.now().plusSeconds((long) minutes * 60));
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
        for (Map<String, Object> subTopic : safeList(topic.get("subTopics"))) {
          for (Map<String, Object> question : safeList(subTopic.get("questions"))) {
            List<Instant> revisionTimes = extractRevisionTimes(question);
            String problemId = String.valueOf(question.getOrDefault("id", "unknown"));
            String title = String.valueOf(question.getOrDefault("text", "Untitled problem"));
            for (int i = 0; i < revisionTimes.size(); i++) {
              upsertRevisionNotification(userId, sheet, problemId, title, i + 1, revisionTimes.get(i));
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
      String problemId,
      String title,
      int revisionNumber,
      Instant dueAt) {
    RevisionNotification notification = notificationRepository
        .findByUserIdAndSheetIdAndProblemIdAndRevisionNumber(userId, sheet.getId(), problemId, revisionNumber)
        .orElseGet(RevisionNotification::new);

    Instant now = Instant.now();
    if (notification.getCreatedAt() == null) {
      notification.setCreatedAt(now);
      notification.setStatus("pending");
    }

    notification.setUserId(userId);
    notification.setSheetId(sheet.getId());
    notification.setProblemId(problemId);
    notification.setSheetTitle(sheet.getTitle());
    notification.setTitle(title);
    notification.setRevisionNumber(revisionNumber);
    notification.setDueAt(dueAt);
    notification.setMessage("Revision " + revisionNumber + " for " + sheet.getTitle() + " is due now.");
    notification.setLink("/app/" + sheet.getId() + "?problemId=" + problemId);
    refreshDueStatusIfNeeded(notification);
    notification.setUpdatedAt(now);

    notificationRepository.save(notification);
  }

  private void refreshDueStatusIfNeeded(RevisionNotification notification) {
    Instant now = Instant.now();
    String status = notification.getStatus() == null ? "pending" : notification.getStatus();
    if ("completed".equals(status) || "read".equals(status)) return;

    if (notification.getSnoozedUntil() != null && notification.getSnoozedUntil().isAfter(now)) {
      notification.setStatus("snoozed");
      return;
    }

    if (notification.getDueAt() != null && !notification.getDueAt().isAfter(now)) {
      notification.setStatus("due");
    } else {
      notification.setStatus("pending");
    }
  }

  private RevisionNotification getOwnedNotification(String userId, String id) {
    return notificationRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
  }
}
