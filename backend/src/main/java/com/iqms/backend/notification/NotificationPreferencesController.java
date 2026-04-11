package com.iqms.backend.notification;

import com.iqms.backend.dto.notification.NotificationPreferencesUpdateRequest;
import com.iqms.backend.model.NotificationPreferences;
import com.iqms.backend.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notification-preferences")
public class NotificationPreferencesController {
  private final NotificationPreferencesService preferencesService;
  private final CurrentUser currentUser;

  public NotificationPreferencesController(NotificationPreferencesService preferencesService, CurrentUser currentUser) {
    this.preferencesService = preferencesService;
    this.currentUser = currentUser;
  }

  @GetMapping
  public NotificationPreferences get(HttpServletRequest request) {
    return preferencesService.getForUser(currentUser.getUserId(request));
  }

  @PostMapping
  public NotificationPreferences update(HttpServletRequest request, @RequestBody NotificationPreferencesUpdateRequest body) {
    return preferencesService.updateForUser(currentUser.getUserId(request), body);
  }
}
