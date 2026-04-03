package com.iqms.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private final String secret;
  private final long expirationSeconds;

  public TokenService(
      @Value("${app.auth.secret:change-me-super-secret-key}") String secret,
      @Value("${app.auth.expiration-seconds:604800}") long expirationSeconds) {
    this.secret = secret;
    this.expirationSeconds = expirationSeconds;
  }

  public String issueToken(String userId) {
    long expiresAt = Instant.now().getEpochSecond() + expirationSeconds;
    String payload = userId + ":" + expiresAt;
    String signature = sign(payload);
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString((payload + ":" + signature).getBytes(StandardCharsets.UTF_8));
  }

  public Optional<String> validateAndGetUserId(String token) {
    try {
      byte[] decodedBytes = Base64.getUrlDecoder().decode(token);
      String decoded = new String(decodedBytes, StandardCharsets.UTF_8);
      String[] parts = decoded.split(":");
      if (parts.length != 3) return Optional.empty();

      String userId = parts[0];
      long expiresAt = Long.parseLong(parts[1]);
      String signature = parts[2];
      String payload = userId + ":" + expiresAt;

      if (!sign(payload).equals(signature)) return Optional.empty();
      if (Instant.now().getEpochSecond() > expiresAt) return Optional.empty();

      return Optional.of(userId);
    } catch (Exception ex) {
      return Optional.empty();
    }
  }

  private String sign(String payload) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
      mac.init(keySpec);
      byte[] signed = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(signed);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to sign token", ex);
    }
  }
}
