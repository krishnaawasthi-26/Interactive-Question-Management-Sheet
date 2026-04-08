package com.iqms.backend.dto;

import java.time.Instant;
import java.util.Map;

public class ErrorResponse {
  private final Instant timestamp;
  private final int status;
  private final String error;
  private final String message;
  private final String path;
  private final String code;
  private final Long retryAfterSeconds;
  private final Long disabledUntilEpochMs;
  private final Map<String, String> validationErrors;

  public ErrorResponse(int status, String error, String message, String path) {
    this(status, error, message, path, null, null, null, null);
  }

  public ErrorResponse(
      int status,
      String error,
      String message,
      String path,
      String code,
      Long retryAfterSeconds,
      Long disabledUntilEpochMs,
      Map<String, String> validationErrors) {
    this.timestamp = Instant.now();
    this.status = status;
    this.error = error;
    this.message = message;
    this.path = path;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.disabledUntilEpochMs = disabledUntilEpochMs;
    this.validationErrors = validationErrors;
  }

  public Instant getTimestamp() {
    return timestamp;
  }

  public int getStatus() {
    return status;
  }

  public String getError() {
    return error;
  }

  public String getMessage() {
    return message;
  }

  public String getPath() {
    return path;
  }

  public String getCode() {
    return code;
  }

  public Long getRetryAfterSeconds() {
    return retryAfterSeconds;
  }

  public Long getDisabledUntilEpochMs() {
    return disabledUntilEpochMs;
  }

  public Map<String, String> getValidationErrors() {
    return validationErrors;
  }
}
