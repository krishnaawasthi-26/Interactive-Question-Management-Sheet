package com.iqms.backend.exception;

import com.iqms.backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> handleResponseStatusException(
      ResponseStatusException exception,
      HttpServletRequest request) {
    HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
    String reason = exception.getReason() == null ? "Request failed" : exception.getReason();
    return ResponseEntity.status(status)
        .body(new ErrorResponse(status.value(), status.getReasonPhrase(), reason, request.getRequestURI()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      MethodArgumentNotValidException exception,
      HttpServletRequest request) {
    Map<String, String> validationErrors = new LinkedHashMap<>();
    for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
      validationErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
    }

    String message = validationErrors.values().stream().findFirst().orElse("Invalid request");
    return ResponseEntity.badRequest().body(
        new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            message,
            request.getRequestURI(),
            null,
            null,
            null,
            validationErrors));
  }

  @ExceptionHandler(ApiRequestException.class)
  public ResponseEntity<ErrorResponse> handleApiRequestException(
      ApiRequestException exception,
      HttpServletRequest request) {
    HttpStatus status = exception.getStatus();
    return ResponseEntity.status(status).body(
        new ErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            exception.getMessage(),
            request.getRequestURI(),
            exception.getCode(),
            exception.getRetryAfterSeconds(),
            exception.getDisabledUntilEpochMs(),
            null));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnhandled(Exception exception, HttpServletRequest request) {
    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
    return ResponseEntity.status(status)
        .body(new ErrorResponse(status.value(), status.getReasonPhrase(), "Internal server error", request.getRequestURI()));
  }
}
