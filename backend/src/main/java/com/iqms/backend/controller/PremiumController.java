package com.iqms.backend.controller;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.PremiumAccessService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/premium")
public class PremiumController {
  private final CurrentUser currentUser;
  private final PremiumAccessService premiumAccessService;
  private final UserRepository userRepository;

  public PremiumController(
      CurrentUser currentUser,
      PremiumAccessService premiumAccessService,
      UserRepository userRepository) {
    this.currentUser = currentUser;
    this.premiumAccessService = premiumAccessService;
    this.userRepository = userRepository;
  }

  @GetMapping("/plans")
  public ResponseEntity<Map<String, Object>> plans() {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("currency", "INR");
    payload.put("plans", new Object[] {
        Map.of("id", "monthly", "name", "Monthly", "price", 99),
        Map.of("id", "yearly", "name", "Yearly", "price", 1999),
    });
    return ResponseEntity.ok(payload);
  }

  @PostMapping("/subscribe")
  public ResponseEntity<Map<String, Object>> subscribe(
      HttpServletRequest request,
      @RequestBody Map<String, String> body) {
    String plan = body == null ? null : body.get("plan");
    if (plan == null || plan.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan is required.");
    }

    User user = premiumAccessService.findUser(currentUser.getUserId(request));
    Instant now = Instant.now();
    Instant start = user.getPremiumUntil() != null && user.getPremiumUntil().isAfter(now) ? user.getPremiumUntil() : now;
    Instant nextPremiumUntil;
    if ("monthly".equalsIgnoreCase(plan)) {
      nextPremiumUntil = start.plus(30, ChronoUnit.DAYS);
    } else if ("yearly".equalsIgnoreCase(plan)) {
      nextPremiumUntil = start.plus(365, ChronoUnit.DAYS);
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported plan.");
    }

    user.setPremiumUntil(nextPremiumUntil);
    user.setPremiumTrialEndsAt(null);
    userRepository.save(user);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("premiumActive", true);
    payload.put("premiumUntil", nextPremiumUntil.toString());
    return ResponseEntity.ok(payload);
  }
}
