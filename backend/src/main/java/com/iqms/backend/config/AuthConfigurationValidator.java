package com.iqms.backend.config;

import com.iqms.backend.config.properties.GoogleOAuthProperties;
import com.iqms.backend.config.properties.MailProperties;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AuthConfigurationValidator {

  private final GoogleOAuthProperties googleOAuthProperties;
  private final MailProperties mailProperties;

  public AuthConfigurationValidator(
      GoogleOAuthProperties googleOAuthProperties,
      MailProperties mailProperties) {
    this.googleOAuthProperties = googleOAuthProperties;
    this.mailProperties = mailProperties;
  }

  @PostConstruct
  public void validate() {
    List<String> errors = new ArrayList<>();

    String clientId = googleOAuthProperties.getClientId();
    if (clientId.isBlank()) {
      errors.add("APP_AUTH_GOOGLE_CLIENT_ID is missing.");
    } else if (!clientId.endsWith(".apps.googleusercontent.com")) {
      errors.add("APP_AUTH_GOOGLE_CLIENT_ID must be a Google Web OAuth client id ending with .apps.googleusercontent.com.");
    }

    if (mailProperties.isEnabled()) {
      if (mailProperties.getHost().isBlank()) {
        errors.add("APP_MAIL_HOST is missing.");
      }
      if (mailProperties.getUsername().isBlank()) {
        errors.add("APP_MAIL_USERNAME is missing.");
      }
      if (mailProperties.getPassword().isBlank()) {
        errors.add("APP_MAIL_PASSWORD is missing.");
      }
      if (mailProperties.getFromAddress().isBlank()) {
        errors.add("APP_MAIL_FROM_ADDRESS is missing.");
      }
      if (mailProperties.getFromName().isBlank()) {
        errors.add("APP_MAIL_FROM_NAME is missing.");
      }
    }

    if (!errors.isEmpty()) {
      throw new IllegalStateException(
          "Invalid auth/mail configuration. Fix these environment variables before starting: "
              + String.join(" ", errors));
    }
  }
}
