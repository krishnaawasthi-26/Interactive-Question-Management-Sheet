package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VerifyOtpRequest {
  @NotBlank(message = "Verification ID is required")
  private String verificationId;

  @NotBlank(message = "OTP is required")
  @Size(min = 6, max = 32, message = "OTP must be between 6 and 32 characters")
  private String otp;

  public String getVerificationId() {
    return verificationId;
  }

  public void setVerificationId(String verificationId) {
    this.verificationId = verificationId;
  }

  public String getOtp() {
    return otp;
  }

  public void setOtp(String otp) {
    this.otp = otp;
  }
}
