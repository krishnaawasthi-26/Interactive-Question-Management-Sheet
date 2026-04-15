package com.iqms.backend.exception;

import com.iqms.backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> handleResponseStatusException(
      ResponseStatusException exception,
      HttpServletRequest request) {
    HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
    String reason = exception.getReason() == null ? "Request failed" : exception.getReason();
    log.warn("Request failed: status={}, path={}, message={}", status.value(), request.getRequestURI(), reason);
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
    log.warn("Validation failed: path={}, errors={}", request.getRequestURI(), validationErrors.keySet());
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

  @ExceptionHandler({
      ConstraintViolationException.class,
      MethodArgumentTypeMismatchException.class,
      MissingServletRequestParameterException.class,
      HttpMessageNotReadableException.class,
      IllegalArgumentException.class
  })
  public ResponseEntity<ErrorResponse> handleBadRequest(Exception exception, HttpServletRequest request) {
    HttpStatus status = HttpStatus.BAD_REQUEST;
    String message = "Invalid request";
    if (exception instanceof ConstraintViolationException constraintViolationException) {
      message = constraintViolationException.getConstraintViolations().stream()
          .findFirst()
          .map(violation -> violation.getMessage())
          .orElse(message);
    } else if (exception instanceof MethodArgumentTypeMismatchException mismatchException) {
      message = "Invalid value for " + mismatchException.getName();
    } else if (exception instanceof MissingServletRequestParameterException missingParameterException) {
      message = missingParameterException.getParameterName() + " is required.";
    } else if (exception.getMessage() != null && !exception.getMessage().isBlank()) {
      message = exception.getMessage();
    }

    log.warn("Bad request: path={}, type={}, message={}", request.getRequestURI(),
        exception.getClass().getSimpleName(), message);
    return ResponseEntity.status(status)
        .body(new ErrorResponse(status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
  }

  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<ErrorResponse> handleDuplicateKey(DuplicateKeyException exception, HttpServletRequest request) {
    HttpStatus status = HttpStatus.CONFLICT;
    log.warn("Duplicate key conflict: path={}", request.getRequestURI());
    return ResponseEntity.status(status).body(
        new ErrorResponse(status.value(), status.getReasonPhrase(), "Resource already exists.", request.getRequestURI()));
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

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> handleDataAccessException(
      DataAccessException exception,
      HttpServletRequest request) {
    HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
    log.error("Database access error: path={}, type={}", request.getRequestURI(), exception.getClass().getName(), exception);
    return ResponseEntity.status(status).body(
        new ErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            "Database operation failed. Please retry.",
            request.getRequestURI()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnhandled(Exception exception, HttpServletRequest request) {
    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
    log.error("Unhandled server error: path={}, type={}", request.getRequestURI(), exception.getClass().getName(), exception);
    return ResponseEntity.status(status)
        .body(new ErrorResponse(status.value(), status.getReasonPhrase(), "Internal server error", request.getRequestURI()));
  }
}
