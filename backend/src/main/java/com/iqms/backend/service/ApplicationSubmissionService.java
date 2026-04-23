package com.iqms.backend.service;

import com.iqms.backend.dto.application.ApplicationCreateOrderRequest;
import com.iqms.backend.dto.application.ApplicationVerifyPaymentRequest;
import com.iqms.backend.model.ApplicationSubmission;
import com.iqms.backend.repository.ApplicationSubmissionRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationSubmissionService {
  private static final Logger log = LoggerFactory.getLogger(ApplicationSubmissionService.class);

  private static final String PAYMENT_PROVIDER = "razorpay";
  private static final Integer REGISTRATION_AMOUNT_PAISE = 4900;
  private static final String REGISTRATION_CURRENCY = "INR";
  private static final Set<String> BLOCKING_APPLICATION_STATUSES = Set.of("PAID", "SUBMITTED");
  private static final Set<String> ALLOWED_GENDERS = Set.of("male", "female", "other", "prefer not to say");
  private static final Set<String> ALLOWED_FIELDS = Set.of(
      "dsa",
      "web development",
      "app development",
      "ai / ml",
      "data science",
      "other");
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
  private static final Pattern INDIAN_MOBILE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
  private static final DateTimeFormatter MONTH_KEY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

  private final ApplicationSubmissionRepository applicationSubmissionRepository;
  private final RazorpayService razorpayService;

  public ApplicationSubmissionService(
      ApplicationSubmissionRepository applicationSubmissionRepository,
      RazorpayService razorpayService) {
    this.applicationSubmissionRepository = applicationSubmissionRepository;
    this.razorpayService = razorpayService;
  }

  public Map<String, Object> createPaymentOrder(ApplicationCreateOrderRequest request) {
    if (!razorpayService.isConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway is unavailable.");
    }

    SanitizedApplicationInput input = sanitizeAndValidate(request);
    assertNoDuplicatePaidSubmission(input);

    Map<String, Object> order = razorpayService.createOrder(Map.of(
        "amount", REGISTRATION_AMOUNT_PAISE,
        "currency", REGISTRATION_CURRENCY,
        "receipt", "application_" + UUID.randomUUID().toString().replace("-", ""),
        "notes", Map.of(
            "source", "application-form",
            "field", input.fieldApplyingFor())));

    String providerOrderId = asString(order.get("id"));
    if (providerOrderId == null || providerOrderId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order.");
    }

    Instant now = Instant.now();
    ApplicationSubmission submission = new ApplicationSubmission();
    submission.setFullName(input.fullName());
    submission.setEmail(input.email());
    submission.setPhoneNumber(input.phoneNumber());
    submission.setWhatsappNumber(input.whatsappNumber());
    submission.setGender(input.gender());
    submission.setCollege(input.college());
    submission.setFieldApplyingFor(input.fieldApplyingFor());
    submission.setAmountPaid(REGISTRATION_AMOUNT_PAISE);
    submission.setCurrency(REGISTRATION_CURRENCY);
    submission.setPaymentStatus("PENDING_PAYMENT");
    submission.setApplicationStatus("PENDING_PAYMENT");
    submission.setPaymentProvider(PAYMENT_PROVIDER);
    submission.setPaymentOrderId(providerOrderId);
    submission.setNormalizedEmail(input.normalizedEmail());
    submission.setNormalizedPhone(input.normalizedPhone());
    submission.setNormalizedField(input.normalizedField());
    submission.setApplicationMonthKey(input.applicationMonthKey());
    submission.setCreatedAt(now);
    submission.setUpdatedAt(now);

    applicationSubmissionRepository.save(submission);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("orderId", providerOrderId);
    response.put("amount", REGISTRATION_AMOUNT_PAISE);
    response.put("currency", REGISTRATION_CURRENCY);
    response.put("keyId", razorpayService.publicKeyId());
    response.put("applicationMonthKey", input.applicationMonthKey());
    return response;
  }

  public Map<String, Object> verifyAndFinalize(ApplicationVerifyPaymentRequest request) {
    if (!razorpayService.isConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway is unavailable.");
    }

    String paymentOrderId = cleanText(request.paymentOrderId());
    String paymentId = cleanText(request.paymentId());
    String paymentSignature = cleanText(request.paymentSignature());

    ApplicationSubmission submission = applicationSubmissionRepository
        .findByPaymentOrderId(paymentOrderId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown payment order."));

    if ("SUBMITTED".equalsIgnoreCase(submission.getApplicationStatus())) {
      return toSuccessResponse(submission);
    }

    if (!razorpayService.isValidSignature(paymentOrderId, paymentId, paymentSignature)) {
      submission.setPaymentStatus("PAYMENT_FAILED");
      submission.setApplicationStatus("PAYMENT_FAILED");
      submission.setUpdatedAt(Instant.now());
      applicationSubmissionRepository.save(submission);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment verification failed.");
    }

    Map<String, Object> gatewayPayment = razorpayService.fetchPayment(paymentId);
    String gatewayStatus = normalizeStatus(asString(gatewayPayment.get("status")));
    String gatewayOrderId = asString(gatewayPayment.get("order_id"));
    String gatewayCurrency = asString(gatewayPayment.get("currency"));
    Integer gatewayAmount = asInteger(gatewayPayment.get("amount"));

    if (!paymentOrderId.equals(gatewayOrderId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment order mismatch.");
    }
    if (!REGISTRATION_CURRENCY.equalsIgnoreCase(gatewayCurrency == null ? "" : gatewayCurrency)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment currency mismatch.");
    }
    if (!REGISTRATION_AMOUNT_PAISE.equals(gatewayAmount)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount mismatch.");
    }
    if (!"captured".equalsIgnoreCase(gatewayStatus) && !"authorized".equalsIgnoreCase(gatewayStatus)) {
      submission.setPaymentStatus("PAYMENT_FAILED");
      submission.setApplicationStatus("PAYMENT_FAILED");
      submission.setPaymentId(paymentId);
      submission.setPaymentSignature(paymentSignature);
      submission.setUpdatedAt(Instant.now());
      applicationSubmissionRepository.save(submission);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not completed.");
    }

    assertNoDuplicatePaidSubmission(new SanitizedApplicationInput(
        submission.getFullName(),
        submission.getEmail(),
        submission.getPhoneNumber(),
        submission.getWhatsappNumber(),
        submission.getGender(),
        submission.getCollege(),
        submission.getFieldApplyingFor(),
        submission.getNormalizedEmail(),
        submission.getNormalizedPhone(),
        submission.getNormalizedField(),
        submission.getApplicationMonthKey()));

    submission.setPaymentId(paymentId);
    submission.setPaymentSignature(paymentSignature);
    submission.setPaymentStatus("PAID");
    submission.setApplicationStatus("SUBMITTED");
    submission.setUpdatedAt(Instant.now());

    try {
      applicationSubmissionRepository.save(submission);
    } catch (DuplicateKeyException duplicateKeyException) {
      log.warn("Duplicate application blocked for order {}", paymentOrderId);
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "You already submitted an application for this field in the current month.");
    }

    return toSuccessResponse(submission);
  }

  private Map<String, Object> toSuccessResponse(ApplicationSubmission submission) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("applicationId", submission.getId());
    payload.put("fullName", submission.getFullName());
    payload.put("email", submission.getEmail());
    payload.put("fieldApplyingFor", submission.getFieldApplyingFor());
    payload.put("applicationStatus", submission.getApplicationStatus());
    payload.put("paymentStatus", submission.getPaymentStatus());
    payload.put("createdAt", submission.getCreatedAt() == null ? null : submission.getCreatedAt().toString());
    payload.put("updatedAt", submission.getUpdatedAt() == null ? null : submission.getUpdatedAt().toString());
    return payload;
  }

  private SanitizedApplicationInput sanitizeAndValidate(ApplicationCreateOrderRequest request) {
    String fullName = requireText(request.fullName(), "Full Name is required.");
    String email = requireText(request.email(), "Email is required.");
    String phoneNumber = requireText(request.phoneNumber(), "Phone Number is required.");
    String whatsappNumber = requireText(request.whatsappNumber(), "WhatsApp Number is required.");
    String gender = requireText(request.gender(), "Gender is required.");
    String college = requireText(request.college(), "College is required.");
    String fieldApplyingFor = requireText(request.fieldApplyingFor(), "Field Applying For is required.");

    if (!EMAIL_PATTERN.matcher(email).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a valid email address.");
    }

    String normalizedPhone = normalizeIndianPhone(phoneNumber, "Phone Number");
    String normalizedWhatsapp = normalizeIndianPhone(whatsappNumber, "WhatsApp Number");
    String normalizedGender = normalizeSpaces(gender).toLowerCase(Locale.ROOT);
    if (!ALLOWED_GENDERS.contains(normalizedGender)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a valid gender.");
    }

    String normalizedField = normalizeField(fieldApplyingFor);
    String monthKey = monthKeyNow();

    return new SanitizedApplicationInput(
        normalizeSpaces(fullName),
        email.toLowerCase(Locale.ROOT),
        normalizedPhone,
        normalizedWhatsapp,
        toDisplayGender(normalizedGender),
        normalizeSpaces(college),
        toDisplayField(normalizedField),
        email.toLowerCase(Locale.ROOT),
        normalizedPhone,
        normalizedField,
        monthKey);
  }

  private void assertNoDuplicatePaidSubmission(SanitizedApplicationInput input) {
    boolean duplicateByEmail = applicationSubmissionRepository
        .existsByNormalizedEmailAndNormalizedFieldAndApplicationMonthKeyAndApplicationStatusIn(
            input.normalizedEmail(),
            input.normalizedField(),
            input.applicationMonthKey(),
            BLOCKING_APPLICATION_STATUSES);

    boolean duplicateByPhone = applicationSubmissionRepository
        .existsByNormalizedPhoneAndNormalizedFieldAndApplicationMonthKeyAndApplicationStatusIn(
            input.normalizedPhone(),
            input.normalizedField(),
            input.applicationMonthKey(),
            BLOCKING_APPLICATION_STATUSES);

    if (duplicateByEmail || duplicateByPhone) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "You already submitted an application for this field in the current month.");
    }
  }

  private String monthKeyNow() {
    return MONTH_KEY_FORMATTER.format(Instant.now().atZone(ZoneId.systemDefault()));
  }

  private String requireText(String value, String message) {
    String cleaned = cleanText(value);
    if (cleaned == null || cleaned.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    return cleaned;
  }

  private String cleanText(String value) {
    if (value == null) {
      return null;
    }
    String cleaned = normalizeSpaces(value);
    return cleaned.isBlank() ? null : cleaned;
  }

  private String normalizeSpaces(String value) {
    return value == null ? "" : value.trim().replaceAll("\\s+", " ");
  }

  private String normalizeIndianPhone(String rawValue, String fieldLabel) {
    String digits = rawValue == null ? "" : rawValue.replaceAll("[^0-9]", "");
    if (digits.length() == 12 && digits.startsWith("91")) {
      digits = digits.substring(2);
    }
    if (digits.length() == 11 && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    if (!INDIAN_MOBILE_PATTERN.matcher(digits).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          fieldLabel + " must be a valid Indian mobile number.");
    }
    return "+91" + digits;
  }

  private String normalizeField(String value) {
    String normalized = normalizeSpaces(value).toLowerCase(Locale.ROOT);
    if (!ALLOWED_FIELDS.contains(normalized)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a valid field.");
    }
    return normalized;
  }

  private String toDisplayGender(String normalizedGender) {
    return switch (normalizedGender) {
      case "male" -> "Male";
      case "female" -> "Female";
      case "other" -> "Other";
      default -> "Prefer not to say";
    };
  }

  private String toDisplayField(String normalizedField) {
    return switch (normalizedField) {
      case "dsa" -> "DSA";
      case "web development" -> "Web Development";
      case "app development" -> "App Development";
      case "ai / ml" -> "AI / ML";
      case "data science" -> "Data Science";
      default -> "Other";
    };
  }

  private String normalizeStatus(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
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
    } catch (NumberFormatException exception) {
      return null;
    }
  }

  public List<String> getAllowedFieldOptions() {
    return List.of("DSA", "Web Development", "App Development", "AI / ML", "Data Science", "Other");
  }

  private record SanitizedApplicationInput(
      String fullName,
      String email,
      String phoneNumber,
      String whatsappNumber,
      String gender,
      String college,
      String fieldApplyingFor,
      String normalizedEmail,
      String normalizedPhone,
      String normalizedField,
      String applicationMonthKey) {
  }
}
