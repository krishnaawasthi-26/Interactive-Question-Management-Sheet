package com.iqms.backend.dto;

public class OtpChallengeResponse {
  private String verificationId;
  private String message;

  public OtpChallengeResponse() {}

  public OtpChallengeResponse(String verificationId, String message) {
    this.verificationId = verificationId;
    this.message = message;
  }

  public String getVerificationId() {
    return verificationId;
  }

  public void setVerificationId(String verificationId) {
    this.verificationId = verificationId;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
