package com.iqms.backend.service;

import com.iqms.backend.config.properties.GoogleOAuthProperties;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifier {

  private final RestClient restClient;
  private final GoogleOAuthProperties googleOAuthProperties;

  public GoogleTokenVerifier(GoogleOAuthProperties googleOAuthProperties) {
    this.restClient = RestClient.create();
    this.googleOAuthProperties = googleOAuthProperties;
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
    if (!googleOAuthProperties.getClientId().equals(audience)) {
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
