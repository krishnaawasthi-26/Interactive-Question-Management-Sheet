package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.CreateAlarmRequest;
import com.iqms.backend.dto.notification.NotificationActionResponse;
import com.iqms.backend.dto.notification.NotificationFilterRequest;
import com.iqms.backend.dto.notification.PushSubscriptionRequest;
import com.iqms.backend.dto.notification.RescheduleRequest;
import com.iqms.backend.dto.notification.SnoozeRequest;
import com.iqms.backend.dto.notification.UnreadCountResponse;
import com.iqms.backend.model.RevisionNotification;
import com.iqms.backend.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class RevisionNotificationController {
  private final RevisionNotificationService notificationService;
  private final CurrentUser currentUser;

  public RevisionNotificationController(RevisionNotificationService notificationService, CurrentUser currentUser) {
    this.notificationService = notificationService;
    this.currentUser = currentUser;
  }

  @GetMapping
  public List<RevisionNotification> fetchNotifications(
      HttpServletRequest request,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "40") int size) {
    NotificationFilterRequest filter = new NotificationFilterRequest();
    filter.setType(type);
    filter.setStatus(status);
    filter.setPage(page);
    filter.setSize(size);
    return notificationService.fetchNotifications(currentUser.getUserId(request), filter);
  }

  @GetMapping("/unread-count")
  public UnreadCountResponse fetchUnreadCount(HttpServletRequest request) {
    return new UnreadCountResponse(notificationService.unreadCount(currentUser.getUserId(request)));
  }

  @PostMapping("/alarms")
  public NotificationActionResponse createAlarm(HttpServletRequest request, @Valid @RequestBody CreateAlarmRequest body) {
    return notificationService.createAlarm(currentUser.getUserId(request), body);
  }

  @PostMapping("/mark-all-read")
  public Map<String, Long> markAllRead(HttpServletRequest request) {
    return Map.of("updated", notificationService.markAllRead(currentUser.getUserId(request)));
  }

  @PostMapping("/{notificationId}/read")
  public NotificationActionResponse markRead(HttpServletRequest request, @PathVariable String notificationId) {
    return notificationService.markRead(currentUser.getUserId(request), notificationId);
  }

  @PostMapping("/{notificationId}/done")
  public NotificationActionResponse markDone(HttpServletRequest request, @PathVariable String notificationId) {
    return notificationService.markDone(currentUser.getUserId(request), notificationId);
  }

  @PostMapping("/{notificationId}/dismiss")
  public NotificationActionResponse dismiss(HttpServletRequest request, @PathVariable String notificationId) {
    return notificationService.dismiss(currentUser.getUserId(request), notificationId);
  }

  @PostMapping("/{notificationId}/archive")
  public NotificationActionResponse archive(HttpServletRequest request, @PathVariable String notificationId) {
    return notificationService.archive(currentUser.getUserId(request), notificationId);
  }

  @DeleteMapping("/{notificationId}")
  public void delete(HttpServletRequest request, @PathVariable String notificationId) {
    notificationService.delete(currentUser.getUserId(request), notificationId);
  }

  @PostMapping("/{notificationId}/snooze")
  public NotificationActionResponse snooze(
      HttpServletRequest request,
      @PathVariable String notificationId,
      @Valid @RequestBody SnoozeRequest body) {
    return notificationService.snooze(currentUser.getUserId(request), notificationId, body.getMinutes());
  }

  @PostMapping("/{notificationId}/reschedule")
  public NotificationActionResponse reschedule(
      HttpServletRequest request,
      @PathVariable String notificationId,
      @Valid @RequestBody RescheduleRequest body) {
    return notificationService.reschedule(currentUser.getUserId(request), notificationId, body.getScheduledFor());
  }

  @PostMapping("/{notificationId}/overdue")
  public NotificationActionResponse markOverdue(HttpServletRequest request, @PathVariable String notificationId) {
    return notificationService.markOverdue(currentUser.getUserId(request), notificationId);
  }

  @PostMapping("/push-subscriptions")
  public void registerPushSubscription(HttpServletRequest request, @Valid @RequestBody PushSubscriptionRequest body) {
    notificationService.registerPushSubscription(currentUser.getUserId(request), body);
  }
}
