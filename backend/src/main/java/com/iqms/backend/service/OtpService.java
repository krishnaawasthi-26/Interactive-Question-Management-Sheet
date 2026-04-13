package com.iqms.backend.service;

import com.iqms.backend.config.properties.OtpProperties;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OtpService {

  private static final long OTP_TTL_SECONDS = 600;
  private final SecureRandom secureRandom = new SecureRandom();
  private final Map<String, OtpRecord> otpRecords = new ConcurrentHashMap<>();
  private final OtpProperties otpProperties;

  public OtpService(OtpProperties otpProperties) {
    this.otpProperties = otpProperties;
  }

  public OtpChallenge issueOtp(String email, String purpose, String payloadKey) {
    String verificationId = UUID.randomUUID().toString();
    String code = String.format("%06d", secureRandom.nextInt(1_000_000));
    OtpRecord record = new OtpRecord(email, purpose, payloadKey, code, Instant.now().plusSeconds(OTP_TTL_SECONDS));
    otpRecords.put(verificationId, record);
    return new OtpChallenge(verificationId, code);
  }

  public OtpRecord verifyOtp(String verificationId, String otp, String expectedPurpose) {
    OtpRecord record = otpRecords.get(verificationId);
    if (record == null || !record.purpose().equals(expectedPurpose)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification request.");
    }
    if (record.expiresAt().isBefore(Instant.now())) {
      otpRecords.remove(verificationId);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new one.");
    }

    String normalizedOtp = normalizeOtp(otp);
    if (!record.code().equals(normalizedOtp) && !isBypassOtp(normalizedOtp)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP. Please try again.");
    }

    otpRecords.remove(verificationId);
    return record;
  }

  private boolean isBypassOtp(String normalizedOtp) {
    String bypassKey = otpProperties.getBypassKey();
    return !bypassKey.isBlank() && bypassKey.equals(normalizedOtp);
  }

  private String normalizeOtp(String value) {
    return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase();
  }

  public record OtpChallenge(String verificationId, String code) {}

  public record OtpRecord(String email, String purpose, String payloadKey, String code, Instant expiresAt) {}
}
