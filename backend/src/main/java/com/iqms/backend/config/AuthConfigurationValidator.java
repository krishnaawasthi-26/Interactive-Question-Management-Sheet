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

    String clientId = googleOAuthProperties.getClientId();
    if (clientId.isBlank()) {
      errors.add("APP_AUTH_GOOGLE_CLIENT_ID is missing.");
    } else if (!clientId.endsWith(".apps.googleusercontent.com")) {
      errors.add("APP_AUTH_GOOGLE_CLIENT_ID must be a Google Web OAuth client id ending with .apps.googleusercontent.com.");
    }

    if (mailProperties.isEnabled()) {
      if (mailSenderProvider.getIfAvailable() == null) {
        errors.add("JavaMailSender bean is missing. Ensure spring-boot-starter-mail is on the classpath.");
      }
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
        errors.add("APP_MAIL_FROM is missing.");
      }
      if ("smtp.gmail.com".equalsIgnoreCase(mailProperties.getHost())) {
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

    if (razorpayProperties.isEnabled()) {
      if (razorpayProperties.getKeyId().isBlank()) {
        errors.add("RAZORPAY_KEY_ID is missing.");
      }
      if (razorpayProperties.getKeySecret().isBlank()) {
        errors.add("RAZORPAY_KEY_SECRET is missing.");
      }
    }

    if (!errors.isEmpty()) {
      throw new IllegalStateException(
          "Invalid auth/mail configuration. Fix these environment variables before starting: "
              + String.join(" ", errors));
    }
  }
}
