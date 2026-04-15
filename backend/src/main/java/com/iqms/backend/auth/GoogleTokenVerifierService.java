package com.iqms.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifierService {

  private final GoogleIdTokenVerifier verifier;
  private final List<String> audience;

  public GoogleTokenVerifierService(
      @Value("${app.auth.google-client-id:}") String clientId,
      @Value("${app.auth.google-client-ids:}") String clientIds) {
    this.audience = Stream.concat(splitIds(clientId).stream(), splitIds(clientIds).stream())
        .distinct()
        .toList();

    if (this.audience.isEmpty()) {
      this.verifier = null;
      return;
    }

    try {
      this.verifier = new GoogleIdTokenVerifier.Builder(
          GoogleNetHttpTransport.newTrustedTransport(),
          JacksonFactory.getDefaultInstance())
          .setAudience(this.audience)
          .build();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to initialize Google token verifier", ex);
    }
  }

  public GoogleTokenPayload verify(String idToken) {
    if (verifier == null) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
          "Google auth is not configured on backend.");
    }

    try {
      GoogleIdToken token = verifier.verify(idToken);
      if (token == null || token.getPayload() == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Invalid Google token. Please try again.");
      }

      GoogleIdToken.Payload payload = token.getPayload();
      String email = Objects.toString(payload.getEmail(), "").trim().toLowerCase();
      boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
      String name = Objects.toString(payload.get("name"), "").trim();

      if (email.isBlank() || !emailVerified) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Google account email is not verified.");
      }

      return new GoogleTokenPayload(email, true, name);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "Google token verification failed. Please try again.");
    }
  }

  private List<String> splitIds(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }

    return Arrays.stream(raw.split(","))
        .map(value -> value == null ? "" : value.trim())
        .filter(value -> !value.isBlank())
        .toList();
  }
}
