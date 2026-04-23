package com.iqms.backend.controller;

import com.iqms.backend.dto.application.ApplicationCreateOrderRequest;
import com.iqms.backend.dto.application.ApplicationVerifyPaymentRequest;
import com.iqms.backend.service.ApplicationSubmissionService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationSubmissionController {

  private final ApplicationSubmissionService applicationSubmissionService;

  public ApplicationSubmissionController(ApplicationSubmissionService applicationSubmissionService) {
    this.applicationSubmissionService = applicationSubmissionService;
  }

  @GetMapping("/meta")
  public ResponseEntity<Map<String, Object>> metadata() {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("currency", "INR");
    payload.put("registrationFee", 49);
    payload.put("fields", applicationSubmissionService.getAllowedFieldOptions());
    return ResponseEntity.ok(payload);
  }

  @PostMapping("/create-order")
  public ResponseEntity<Map<String, Object>> createOrder(@Valid @RequestBody ApplicationCreateOrderRequest request) {
    return ResponseEntity.ok(applicationSubmissionService.createPaymentOrder(request));
  }

  @PostMapping("/verify-payment")
  public ResponseEntity<Map<String, Object>> verifyPayment(@Valid @RequestBody ApplicationVerifyPaymentRequest request) {
    return ResponseEntity.ok(applicationSubmissionService.verifyAndFinalize(request));
  }
}
