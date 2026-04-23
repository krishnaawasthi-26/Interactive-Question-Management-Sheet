package com.iqms.backend.dto.application;

import jakarta.validation.constraints.NotBlank;

public record ApplicationCreateOrderRequest(
    @NotBlank(message = "Full Name is required.") String fullName,
    @NotBlank(message = "Email is required.") String email,
    @NotBlank(message = "Phone Number is required.") String phoneNumber,
    @NotBlank(message = "WhatsApp Number is required.") String whatsappNumber,
    @NotBlank(message = "Gender is required.") String gender,
    @NotBlank(message = "College is required.") String college,
    @NotBlank(message = "Field Applying For is required.") String fieldApplyingFor) {
}
