package com.iqms.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.iqms.backend.config.GoogleAuthConfigService;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifierService {

  private final GoogleIdTokenVerifier verifier;
  private final GoogleAuthConfigService googleAuthConfigService;

  public GoogleTokenVerifierService(GoogleAuthConfigService googleAuthConfigService) {
    this.googleAuthConfigService = googleAuthConfigService;

    if (!googleAuthConfigService.isGoogleAuthEnabled()) {
      this.verifier = null;
      return;
    }

    try {
      this.verifier = new GoogleIdTokenVerifier.Builder(
          GoogleNetHttpTransport.newTrustedTransport(),
          JacksonFactory.getDefaultInstance())
          .setAudience(googleAuthConfigService.getGoogleAuthClientIds())
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

  public List<String> getGoogleAuthClientIds() {
    return googleAuthConfigService.getGoogleAuthClientIds();
  }

  public String getPrimaryGoogleAuthClientId() {
    return googleAuthConfigService.getPrimaryGoogleAuthClientId();
  }

  public boolean isGoogleAuthEnabled() {
    return googleAuthConfigService.isGoogleAuthEnabled();
  }
}
