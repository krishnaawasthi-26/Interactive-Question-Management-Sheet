package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.NotificationActionResponse;
import com.iqms.backend.dto.notification.PushSubscriptionRequest;
import com.iqms.backend.dto.notification.SnoozeRequest;
import com.iqms.backend.dto.notification.UnreadCountResponse;
import com.iqms.backend.model.RevisionNotification;
import com.iqms.backend.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
  public ResponseEntity<List<RevisionNotification>> fetchNotifications(HttpServletRequest request) {
    return ResponseEntity.ok(notificationService.fetchNotifications(currentUser.getUserId(request)));
  }

  @GetMapping("/unread-count")
  public ResponseEntity<UnreadCountResponse> fetchUnreadCount(HttpServletRequest request) {
    return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(currentUser.getUserId(request))));
  }

  @PostMapping("/{notificationId}/read")
  public ResponseEntity<NotificationActionResponse> markRead(HttpServletRequest request, @PathVariable String notificationId) {
    return ResponseEntity.ok(notificationService.markRead(currentUser.getUserId(request), notificationId));
  }

  @PostMapping("/{notificationId}/done")
  public ResponseEntity<NotificationActionResponse> markDone(HttpServletRequest request, @PathVariable String notificationId) {
    return ResponseEntity.ok(notificationService.markDone(currentUser.getUserId(request), notificationId));
  }

  @PostMapping("/{notificationId}/snooze")
  public ResponseEntity<NotificationActionResponse> snooze(
      HttpServletRequest request,
      @PathVariable String notificationId,
      @Valid @RequestBody SnoozeRequest body) {
    return ResponseEntity.ok(notificationService.snooze(currentUser.getUserId(request), notificationId, body.getMinutes()));
  }

  @PostMapping("/push-subscriptions")
  public ResponseEntity<Void> registerPushSubscription(HttpServletRequest request, @Valid @RequestBody PushSubscriptionRequest body) {
    notificationService.registerPushSubscription(currentUser.getUserId(request), body);
    return ResponseEntity.accepted().build();
  }
}
