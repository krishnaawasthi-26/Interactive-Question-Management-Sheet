package com.iqms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyOtpRequest {
  @NotBlank(message = "Verification ID is required")
  private String verificationId;

  @NotBlank(message = "OTP is required")
  @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
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
