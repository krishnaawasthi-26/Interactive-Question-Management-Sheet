package com.iqms.backend.service;

import com.iqms.backend.model.User;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EntitlementService {
  private static final Set<String> PREMIUM_FEATURES = Set.of(
      "advanced_analytics",
      "advanced_ai",
      "premium_templates",
      "advanced_exports",
      "unlimited_collaborators",
      "team_unlimited_members");

  private final PremiumAccessService premiumAccessService;

  public EntitlementService(PremiumAccessService premiumAccessService) {
    this.premiumAccessService = premiumAccessService;
  }

  public boolean hasFeature(User user, String featureKey) {
    if (!PREMIUM_FEATURES.contains(featureKey)) return true;
    return premiumAccessService.isPremiumActive(user);
  }

  public void requireFeature(User user, String featureKey) {
    if (hasFeature(user, featureKey)) return;
    throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Feature requires premium plan: " + featureKey);
  }
}
