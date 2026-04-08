package com.iqms.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
  private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

  private final String secret;
  private final long expirationSeconds;

  public TokenService(
      @Value("${app.auth.secret:change-me-super-secret-key}") String secret,
      @Value("${app.auth.expiration-seconds:604800}") long expirationSeconds) {
    this.secret = secret;
    this.expirationSeconds = expirationSeconds;
  }

  public String issueToken(String userId) {
    long issuedAt = Instant.now().getEpochSecond();
    long expiresAt = issuedAt + expirationSeconds;

    String header = URL_ENCODER.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    String payloadJson = String.format("{\"sub\":\"%s\",\"iat\":%d,\"exp\":%d}", userId, issuedAt, expiresAt);
    String payload = URL_ENCODER.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

    String signingInput = header + "." + payload;
    String signature = sign(signingInput);
    return signingInput + "." + signature;
  }

  public Optional<String> validateAndGetUserId(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3) return Optional.empty();

      String signingInput = parts[0] + "." + parts[1];
      String expectedSignature = sign(signingInput);
      if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
        return Optional.empty();
      }

      String payloadJson = new String(URL_DECODER.decode(parts[1]), StandardCharsets.UTF_8);
      String subject = readJsonString(payloadJson, "sub");
      Long expiresAt = readJsonLong(payloadJson, "exp");

      if (subject == null || expiresAt == null) return Optional.empty();
      if (Instant.now().getEpochSecond() > expiresAt) return Optional.empty();

      return Optional.of(subject);
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
      return URL_ENCODER.encodeToString(signed);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to sign token", ex);
    }
  }

  private String readJsonString(String json, String key) {
    String marker = "\"" + key + "\":\"";
    int start = json.indexOf(marker);
    if (start < 0) return null;
    start += marker.length();
    int end = json.indexOf('"', start);
    if (end < 0) return null;
    return json.substring(start, end);
  }

  private Long readJsonLong(String json, String key) {
    String marker = "\"" + key + "\":";
    int start = json.indexOf(marker);
    if (start < 0) return null;
    start += marker.length();
    int end = start;
    while (end < json.length() && Character.isDigit(json.charAt(end))) {
      end++;
    }
    if (end == start) return null;
    return Long.parseLong(json.substring(start, end));
  }
}
