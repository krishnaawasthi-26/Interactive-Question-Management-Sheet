package com.iqms.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RazorpayService {

  private static final String RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

  private final String keyId;
  private final String keySecret;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public RazorpayService(
      @Value("${app.payment.razorpay.key-id:}") String keyId,
      @Value("${app.payment.razorpay.key-secret:}") String keySecret,
      ObjectMapper objectMapper) {
    this.keyId = keyId == null ? "" : keyId.trim();
    this.keySecret = keySecret == null ? "" : keySecret.trim();
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newHttpClient();
  }

  public boolean isConfigured() {
    return !keyId.isBlank() && !keySecret.isBlank();
  }

  public String publicKeyId() {
    return keyId;
  }

  public Map<String, Object> createOrder(Map<String, Object> payload) {
    ensureConfigured();
    return postJson("/orders", payload);
  }

  public Map<String, Object> fetchPayment(String razorpayPaymentId) {
    ensureConfigured();
    return getJson("/payments/" + razorpayPaymentId);
  }

  public boolean isValidSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
    ensureConfigured();
    try {
      String body = razorpayOrderId + "|" + razorpayPaymentId;
      Mac sha256Hmac = Mac.getInstance("HmacSHA256");
      sha256Hmac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = sha256Hmac.doFinal(body.getBytes(StandardCharsets.UTF_8));
      String expected = bytesToHex(digest);
      return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), razorpaySignature.getBytes(StandardCharsets.UTF_8));
    } catch (GeneralSecurityException ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to validate payment signature.");
    }
  }

  private Map<String, Object> postJson(String path, Map<String, Object> payload) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(RAZORPAY_BASE_URL + path))
          .header("Authorization", basicAuthHeader())
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      return parseResponse(response);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to communicate with payment gateway.");
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to communicate with payment gateway.");
    }
  }

  private Map<String, Object> getJson(String path) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(RAZORPAY_BASE_URL + path))
          .header("Authorization", basicAuthHeader())
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      return parseResponse(response);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to validate payment with gateway.");
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to validate payment with gateway.");
    }
  }

  private Map<String, Object> parseResponse(HttpResponse<String> response) throws IOException {
    Map<String, Object> payload = objectMapper.readValue(response.body(), new TypeReference<>() {});
    if (response.statusCode() >= 200 && response.statusCode() < 300) {
      return payload;
    }
    Object error = payload.get("error");
    String message = "Payment gateway request failed.";
    if (error instanceof Map<?, ?> errorMap) {
      Object description = errorMap.get("description");
      if (description instanceof String text && !text.isBlank()) {
        message = text;
      }
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
  }

  private String basicAuthHeader() {
    String auth = keyId + ":" + keySecret;
    return "Basic " + Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
  }

  private void ensureConfigured() {
    if (!isConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway is not configured.");
    }
  }

  private String bytesToHex(byte[] bytes) {
    StringBuilder hex = new StringBuilder(bytes.length * 2);
    for (byte b : bytes) {
      String value = Integer.toHexString(0xff & b);
      if (value.length() == 1) {
        hex.append('0');
      }
      hex.append(value);
    }
    return hex.toString();
  }
}
