package com.iqms.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.iqms.backend.config.GoogleAuthConfigService;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifierService {
  private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

  private final GoogleIdTokenVerifier verifier;
  private final GoogleAuthConfigService googleAuthConfigService;

  public GoogleTokenVerifierService(GoogleAuthConfigService googleAuthConfigService) {
    this.googleAuthConfigService = googleAuthConfigService;

    if (!googleAuthConfigService.isGoogleAuthEnabled()) {
      log.warn("[GoogleAuth] Google auth disabled: no client IDs configured.");
      this.verifier = null;
      return;
    }

    try {
      this.verifier = new GoogleIdTokenVerifier.Builder(
          GoogleNetHttpTransport.newTrustedTransport(),
          JacksonFactory.getDefaultInstance())
          .setAudience(googleAuthConfigService.getGoogleAuthClientIds())
          .build();
      log.info("[GoogleAuth] Google token verifier initialized with {} audience(s).",
          googleAuthConfigService.getGoogleAuthClientIds().size());
    } catch (Exception ex) {
      log.error("[GoogleAuth] Unable to initialize token verifier.", ex);
      throw new IllegalStateException("Unable to initialize Google token verifier", ex);
    }
  }

  public GoogleTokenPayload verify(String idToken) {
    log.info("[GoogleAuth] Verify request received. tokenPresent={}", idToken != null && !idToken.isBlank());
    if (idToken == null || idToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google id token is required.");
    }

    if (verifier == null) {
      log.warn("[GoogleAuth] Verify request rejected because backend Google auth is not configured.");
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
          "Google auth is not configured on backend.");
    }

    try {
      GoogleIdToken token = verifier.verify(idToken);
      if (token == null || token.getPayload() == null) {
        log.warn("[GoogleAuth] Verification failed: token payload is null.");
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Invalid Google token. Please try again.");
      }

      GoogleIdToken.Payload payload = token.getPayload();
      String email = Objects.toString(payload.getEmail(), "").trim().toLowerCase();
      boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
      String name = Objects.toString(payload.get("name"), "").trim();
      String subject = Objects.toString(payload.getSubject(), "").trim();

      if (email.isBlank() || subject.isBlank() || !emailVerified) {
        log.warn("[GoogleAuth] Verification failed due to missing/invalid payload fields. emailPresent={}, subjectPresent={}, emailVerified={}",
            !email.isBlank(), !subject.isBlank(), emailVerified);
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Google account email is not verified.");
      }

      log.info("[GoogleAuth] Verification succeeded for email={} subject={}.", email, subject);
      return new GoogleTokenPayload(email, true, name, subject);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      log.warn("[GoogleAuth] Token verification failed with exception: {}", ex.getMessage());
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
