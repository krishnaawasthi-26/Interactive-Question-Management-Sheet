package com.iqms.backend.config;

import com.iqms.backend.config.properties.GoogleOAuthProperties;
import com.iqms.backend.config.properties.MailProperties;
import com.iqms.backend.config.properties.RazorpayProperties;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class AuthConfigurationValidator {

  private final GoogleOAuthProperties googleOAuthProperties;
  private final MailProperties mailProperties;
  private final RazorpayProperties razorpayProperties;
  private final ObjectProvider<JavaMailSender> mailSenderProvider;

  public AuthConfigurationValidator(
      GoogleOAuthProperties googleOAuthProperties,
      MailProperties mailProperties,
      RazorpayProperties razorpayProperties,
      ObjectProvider<JavaMailSender> mailSenderProvider) {
    this.googleOAuthProperties = googleOAuthProperties;
    this.mailProperties = mailProperties;
    this.razorpayProperties = razorpayProperties;
    this.mailSenderProvider = mailSenderProvider;
  }

  @PostConstruct
  public void validate() {
    List<String> errors = new ArrayList<>();

    validateGoogleConfig(errors);
    validateMailConfig(errors);
    validateRazorpayConfig(errors);

    if (!errors.isEmpty()) {
      throw new IllegalStateException(
          "Invalid auth/mail/payment configuration. Fix these settings before starting: "
              + String.join(" ", errors));
    }
  }

  private void validateGoogleConfig(List<String> errors) {
    for (String clientId : googleOAuthProperties.getClientIds()) {
      if (!clientId.endsWith(".apps.googleusercontent.com")) {
        errors.add("Each APP_AUTH_GOOGLE_CLIENT_ID value must end with .apps.googleusercontent.com.");
      }
    }
  }

  private void validateMailConfig(List<String> errors) {
    if (!mailProperties.isEnabled()) {
      return;
    }

    if (mailSenderProvider.getIfAvailable() == null) {
      errors.add("APP_MAIL_ENABLED=true requires a JavaMailSender bean (spring-boot-starter-mail).");
    }

    requireNonBlank(errors, mailProperties.getHost(), "APP_MAIL_HOST");
    requireNonBlank(errors, mailProperties.getUsername(), "APP_MAIL_USERNAME");
    requireNonBlank(errors, mailProperties.getPassword(), "APP_MAIL_PASSWORD");
    requireNonBlank(errors, mailProperties.getFromAddress(), "APP_MAIL_FROM (or APP_MAIL_FROM_ADDRESS)");

    String host = safeTrim(mailProperties.getHost());
    if ("smtp.gmail.com".equalsIgnoreCase(host)) {
      if (mailProperties.getPort() != 587) {
        errors.add("For Gmail SMTP, APP_MAIL_PORT must be 587 (STARTTLS).");
      }
      if (!mailProperties.isAuth()) {
        errors.add("For Gmail SMTP, APP_MAIL_AUTH must be true.");
      }
      if (!mailProperties.isStarttls()) {
        errors.add("For Gmail SMTP, APP_MAIL_STARTTLS must be true.");
      }
    }
  }

  private void validateRazorpayConfig(List<String> errors) {
    if (!razorpayProperties.isEnabled()) {
      return;
    }

    requireNonBlank(errors, razorpayProperties.getKeyId(), "RAZORPAY_KEY_ID");
    requireNonBlank(errors, razorpayProperties.getKeySecret(), "RAZORPAY_KEY_SECRET");
  }

  private void requireNonBlank(List<String> errors, String value, String propertyName) {
    if (!hasText(value)) {
      errors.add(propertyName + " is required when its integration is enabled.");
    }
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private String safeTrim(String value) {
    return value == null ? "" : value.trim();
  }
}
