package com.iqms.backend.service;

import com.iqms.backend.config.properties.GoogleOAuthProperties;
import java.util.List;
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
    String normalizedToken = idToken == null ? "" : idToken.trim();
    if (normalizedToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token is required.");
    }

    Map response;
    try {
      response = restClient.get()
          .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", normalizedToken)
          .retrieve()
          .body(Map.class);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token.");
    }
    if (response == null || response.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token.");
    }

    List<String> configuredClientIds = googleOAuthProperties.getClientIds();
    if (configuredClientIds.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Google login is not configured on the server. Set APP_AUTH_GOOGLE_CLIENT_ID.");
    }

    String audience = String.valueOf(response.getOrDefault("aud", ""));
    String authorizedParty = String.valueOf(response.getOrDefault("azp", ""));
    boolean matchesClientId =
        configuredClientIds.contains(audience)
            || (!authorizedParty.isBlank() && configuredClientIds.contains(authorizedParty));
    if (!matchesClientId) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience mismatch.");
    }

    String email = String.valueOf(response.getOrDefault("email", "")).trim().toLowerCase();
    String emailVerified = String.valueOf(response.getOrDefault("email_verified", "false"));
    String subject = String.valueOf(response.getOrDefault("sub", ""));
    String name = String.valueOf(response.getOrDefault("name", ""));
    String picture = String.valueOf(response.getOrDefault("picture", ""));
    boolean isEmailVerified = "true".equalsIgnoreCase(emailVerified);

    if (email.isBlank() || subject.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token is missing required claims.");
    }

    return new GoogleProfile(
        email,
        isEmailVerified,
        subject,
        name.isBlank() ? "Google User" : name,
        picture.isBlank() ? null : picture);
  }

  public record GoogleProfile(
      String email,
      boolean emailVerified,
      String subject,
      String name,
      String picture) {}
}
