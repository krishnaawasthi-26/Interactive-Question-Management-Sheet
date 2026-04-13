package com.iqms.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AuthConfigurationValidator {

  private final String googleClientId;

  public AuthConfigurationValidator(@Value("${app.auth.google-client-id:}") String googleClientId) {
    this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
  }

  @PostConstruct
  public void validate() {
    if (googleClientId.isBlank()) {
      throw new IllegalStateException(
          "Missing Google auth config: set APP_AUTH_GOOGLE_CLIENT_ID (web OAuth client id)."
      );
    }
  }
}
