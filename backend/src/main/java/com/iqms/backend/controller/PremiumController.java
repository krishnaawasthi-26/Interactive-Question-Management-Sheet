package com.iqms.backend.controller;

import com.iqms.backend.model.PremiumPaymentOrder;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.PremiumPaymentOrderRepository;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.PremiumAccessService;
import com.iqms.backend.service.RazorpayService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class PremiumController {
  private static final String PROVIDER = "razorpay";

  private final CurrentUser currentUser;
  private final PremiumAccessService premiumAccessService;
  private final UserRepository userRepository;
  private final PremiumPaymentOrderRepository premiumPaymentOrderRepository;
  private final RazorpayService razorpayService;

  public PremiumController(
      CurrentUser currentUser,
      PremiumAccessService premiumAccessService,
      UserRepository userRepository,
      PremiumPaymentOrderRepository premiumPaymentOrderRepository,
      RazorpayService razorpayService) {
    this.currentUser = currentUser;
    this.premiumAccessService = premiumAccessService;
    this.userRepository = userRepository;
    this.premiumPaymentOrderRepository = premiumPaymentOrderRepository;
    this.razorpayService = razorpayService;
  }

  @GetMapping("/premium/plans")
  public ResponseEntity<Map<String, Object>> plans() {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("currency", "INR");
    payload.put("plans", new Object[] {
        Map.of("id", "monthly", "name", "Monthly", "price", 9900),
        Map.of("id", "yearly", "name", "Yearly", "price", 79900),
    });
    return ResponseEntity.ok(payload);
  }

  @GetMapping("/premium/status")
  public ResponseEntity<Map<String, Object>> status(HttpServletRequest request) {
    User user = premiumAccessService.findUser(currentUser.getUserId(request));
    return ResponseEntity.ok(buildPremiumStatus(user));
  }

  @PostMapping("/payments/razorpay/order")
  public ResponseEntity<Map<String, Object>> createOrder(
      HttpServletRequest request,
      @RequestBody Map<String, String> body) {
    if (!razorpayService.isConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway is unavailable.");
    }

    String plan = body == null ? null : body.get("plan");
    PlanInfo planInfo = toPlanInfo(plan);

    User user = premiumAccessService.findUser(currentUser.getUserId(request));
    Instant now = Instant.now();
    String receipt = "premium_" + user.getId() + "_" + UUID.randomUUID().toString().replace("-", "");

    Map<String, Object> order = razorpayService.createOrder(Map.of(
        "amount", planInfo.amountInPaise(),
        "currency", "INR",
        "receipt", receipt,
        "notes", Map.of(
            "userId", user.getId(),
            "plan", planInfo.id())));

    String providerOrderId = asString(order.get("id"));
    if (providerOrderId == null || providerOrderId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to initiate payment.");
    }

    PremiumPaymentOrder paymentOrder = new PremiumPaymentOrder();
    paymentOrder.setProvider(PROVIDER);
    paymentOrder.setProviderOrderId(providerOrderId);
    paymentOrder.setUserId(user.getId());
    paymentOrder.setPlan(planInfo.id());
    paymentOrder.setAmount(planInfo.amountInPaise());
    paymentOrder.setCurrency("INR");
    paymentOrder.setVerificationStatus("pending");
    paymentOrder.setPaymentStatus("created");
    paymentOrder.setCreatedAt(now);
    paymentOrder.setUpdatedAt(now);
    premiumPaymentOrderRepository.save(paymentOrder);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("orderId", providerOrderId);
    payload.put("amount", planInfo.amountInPaise());
    payload.put("currency", "INR");
    payload.put("plan", planInfo.id());
    payload.put("displayName", planInfo.name());
    payload.put("keyId", razorpayService.publicKeyId());
    return ResponseEntity.ok(payload);
  }

  @PostMapping("/payments/razorpay/verify")
  public ResponseEntity<Map<String, Object>> verify(
      HttpServletRequest request,
      @RequestBody Map<String, String> body) {
    User user = premiumAccessService.findUser(currentUser.getUserId(request));

    String razorpayOrderId = safeField(body, "razorpayOrderId");
    String razorpayPaymentId = safeField(body, "razorpayPaymentId");
    String razorpaySignature = safeField(body, "razorpaySignature");

    PremiumPaymentOrder paymentOrder = premiumPaymentOrderRepository
        .findByProviderOrderId(razorpayOrderId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown order."));

    if (!PROVIDER.equalsIgnoreCase(paymentOrder.getProvider())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment provider.");
    }
    if (!user.getId().equals(paymentOrder.getUserId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Order does not belong to user.");
    }

    if ("verified".equalsIgnoreCase(paymentOrder.getVerificationStatus())) {
      return ResponseEntity.ok(buildPremiumStatus(user));
    }

    if (!razorpayService.isValidSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      paymentOrder.setVerificationStatus("failed");
      paymentOrder.setUpdatedAt(Instant.now());
      premiumPaymentOrderRepository.save(paymentOrder);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature.");
    }

    Map<String, Object> gatewayPayment = razorpayService.fetchPayment(razorpayPaymentId);
    String gatewayStatus = asString(gatewayPayment.get("status"));
    String gatewayOrderId = asString(gatewayPayment.get("order_id"));
    String gatewayCurrency = asString(gatewayPayment.get("currency"));
    Integer gatewayAmount = asInteger(gatewayPayment.get("amount"));

    if (!razorpayOrderId.equals(gatewayOrderId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment order mismatch.");
    }
    if (!paymentOrder.getCurrency().equalsIgnoreCase(gatewayCurrency == null ? "" : gatewayCurrency)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment currency mismatch.");
    }
    if (!paymentOrder.getAmount().equals(gatewayAmount)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount mismatch.");
    }
    if (!"captured".equalsIgnoreCase(gatewayStatus) && !"authorized".equalsIgnoreCase(gatewayStatus)) {
      paymentOrder.setVerificationStatus("failed");
      paymentOrder.setPaymentStatus(gatewayStatus == null ? "failed" : gatewayStatus.toLowerCase(Locale.ROOT));
      paymentOrder.setUpdatedAt(Instant.now());
      premiumPaymentOrderRepository.save(paymentOrder);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not completed.");
    }

    paymentOrder.setProviderPaymentId(razorpayPaymentId);
    paymentOrder.setVerificationStatus("verified");
    paymentOrder.setPaymentStatus("paid");
    paymentOrder.setUpdatedAt(Instant.now());
    premiumPaymentOrderRepository.save(paymentOrder);
    applyPremiumPlan(user, paymentOrder.getPlan());

    return ResponseEntity.ok(buildPremiumStatus(user));
  }

  private Map<String, Object> buildPremiumStatus(User user) {
    PremiumAccessService.PremiumAccessState accessState = premiumAccessService.resolveAccessState(user);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("premiumActive", accessState.premiumActive());
    payload.put("premiumAccessType", accessState.premiumAccessType());
    payload.put("premiumUntil", accessState.premiumUntil() == null ? null : accessState.premiumUntil().toString());
    payload.put("premiumPlan", user.getPlanTier());
    payload.put("premiumExpiresAt", accessState.premiumExpiresAt() == null ? null : accessState.premiumExpiresAt().toString());
    payload.put("premiumTrialStartedAt", accessState.premiumTrialStartedAt() == null ? null : accessState.premiumTrialStartedAt().toString());
    payload.put("premiumTrialEndsAt", accessState.premiumTrialEndsAt() == null ? null : accessState.premiumTrialEndsAt().toString());
    payload.put("premiumGrantedReason", accessState.premiumGrantedReason());
    payload.put("hadFreePremiumTrial", accessState.hadFreePremiumTrial());
    payload.put("planTier", user.getPlanTier());
    payload.put("subscriptionStatus", user.getSubscriptionStatus());
    return payload;
  }

  private void applyPremiumPlan(User user, String plan) {
    PlanInfo planInfo = toPlanInfo(plan);

    Instant now = Instant.now();
    Instant start = user.getPremiumUntil() != null && user.getPremiumUntil().isAfter(now) ? user.getPremiumUntil() : now;
    Instant nextPremiumUntil = start.plus(planInfo.durationDays(), ChronoUnit.DAYS);

    user.setPremiumUntil(nextPremiumUntil);
    user.setPremiumTrialStartedAt(null);
    user.setPremiumTrialEndsAt(null);
    user.setPremiumGrantedReason(PremiumAccessService.PREMIUM_SOURCE_PAID);
    user.setPremiumTrialWelcomePending(false);
    user.setPlanTier("premium");
    user.setSubscriptionStatus("active");
    userRepository.save(user);

  }

  private PlanInfo toPlanInfo(String plan) {
    if (plan == null || plan.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan is required.");
    }
    String normalized = plan.toLowerCase(Locale.ROOT);
    if ("monthly".equals(normalized)) {
      return new PlanInfo("monthly", "Monthly", 9900, 30);
    }
    if ("yearly".equals(normalized)) {
      return new PlanInfo("yearly", "Yearly", 79900, 365);
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported plan.");
  }

  private String safeField(Map<String, String> body, String key) {
    String value = body == null ? null : body.get(key);
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required.");
    }
    return value;
  }

  private String asString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  private Integer asInteger(Object value) {
    if (value instanceof Integer intValue) {
      return intValue;
    }
    if (value instanceof Number numValue) {
      return numValue.intValue();
    }
    try {
      return value == null ? null : Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private record PlanInfo(String id, String name, Integer amountInPaise, Integer durationDays) {}
}
