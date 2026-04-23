package com.iqms.backend.dto.application;

import jakarta.validation.constraints.NotBlank;

public record ApplicationVerifyPaymentRequest(
    @NotBlank(message = "paymentOrderId is required.") String paymentOrderId,
    @NotBlank(message = "paymentId is required.") String paymentId,
    @NotBlank(message = "paymentSignature is required.") String paymentSignature) {
}
