package com.iqms.backend.exception;

import org.springframework.http.HttpStatus;

public class ApiRequestException extends RuntimeException {
  private final HttpStatus status;
  private final String code;
  private final Long retryAfterSeconds;
  private final Long disabledUntilEpochMs;

  public ApiRequestException(HttpStatus status, String message) {
    this(status, message, null, null, null);
  }

  public ApiRequestException(
      HttpStatus status,
      String message,
      String code,
      Long retryAfterSeconds,
      Long disabledUntilEpochMs) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.disabledUntilEpochMs = disabledUntilEpochMs;
  }

  public HttpStatus getStatus() {
    return status;
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
}
