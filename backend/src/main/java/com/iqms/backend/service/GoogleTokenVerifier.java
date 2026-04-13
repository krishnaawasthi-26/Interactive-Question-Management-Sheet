package com.iqms.backend.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifier {

  private final RestClient restClient;
  private final String googleClientId;

  public GoogleTokenVerifier(@Value("${app.auth.google-client-id:}") String googleClientId) {
    this.restClient = RestClient.create();
    this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
    if (this.googleClientId.isBlank()) {
      throw new IllegalStateException(
          "Google Sign-In requires APP_AUTH_GOOGLE_CLIENT_ID to be set to a Web OAuth client id."
      );
    }
  }

  public GoogleProfile verify(String idToken) {
    Map response;
    try {
      response = restClient.get()
          .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
          .retrieve()
          .body(Map.class);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token.");
    }

    String audience = String.valueOf(response.getOrDefault("aud", ""));
    if (!googleClientId.equals(audience)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience mismatch.");
    }

    String email = String.valueOf(response.getOrDefault("email", "")).toLowerCase();
    String emailVerified = String.valueOf(response.getOrDefault("email_verified", "false"));
    String subject = String.valueOf(response.getOrDefault("sub", ""));
    String name = String.valueOf(response.getOrDefault("name", ""));

    if (email.isBlank() || subject.isBlank() || !"true".equalsIgnoreCase(emailVerified)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified.");
    }

    return new GoogleProfile(email, subject, name.isBlank() ? "Google User" : name);
  }

  public record GoogleProfile(String email, String subject, String name) {}
}
