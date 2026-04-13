package com.iqms.backend.service;

import com.iqms.backend.config.properties.MailProperties;
import jakarta.mail.internet.MimeMessage;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OtpDeliveryService {
  private static final Logger LOGGER = LoggerFactory.getLogger(OtpDeliveryService.class);

  private final JavaMailSender mailSender;
  private final MailProperties mailProperties;

  public OtpDeliveryService(JavaMailSender mailSender, MailProperties mailProperties) {
    this.mailSender = mailSender;
    this.mailProperties = mailProperties;
  }

  public void sendOtp(String email, String purpose, String otp) {
    if (!mailProperties.isEnabled()) {
      LOGGER.info("OTP email delivery skipped because APP_MAIL_ENABLED is false for purpose={} to={}", purpose, maskEmail(email));
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
      helper.setTo(email);
      String fromAddress = resolveFromAddress();
      helper.setFrom(fromAddress, mailProperties.getFromName());
      helper.setSubject("IQMS verification code");
      helper.setText(buildOtpMessage(otp, purpose));
      mailSender.send(message);
      LOGGER.info("OTP email sent for purpose={} to={}", purpose, maskEmail(email));
    } catch (MailException ex) {
      LOGGER.error(
          "OTP email delivery failed for purpose={} to={} exceptionClass={} message={}",
          purpose,
          maskEmail(email),
          ex.getClass().getName(),
          ex.getMessage(),
          ex);
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Failed to send OTP email via SMTP: "
              + buildFailureReason(ex)
              + ". Check APP_MAIL_* configuration and SMTP provider access.");
    } catch (Exception ex) {
      LOGGER.error(
          "OTP email composition failed for purpose={} to={} exceptionClass={} message={}",
          purpose,
          maskEmail(email),
          ex.getClass().getName(),
          ex.getMessage(),
          ex);
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Failed to compose OTP email: " + buildFailureReason(ex) + ".");
    }
  }

  private String resolveFromAddress() {
    if (!mailProperties.getFromAddress().isBlank()) {
      return mailProperties.getFromAddress();
    }
    return mailProperties.getUsername();
  }

  private String buildFailureReason(Exception ex) {
    String topLevel = ex.getClass().getSimpleName() + ": " + Optional.ofNullable(ex.getMessage()).orElse("(no message)");
    Throwable cause = ex.getCause();
    if (cause == null) {
      return topLevel;
    }
    return topLevel + " | cause=" + cause.getClass().getSimpleName() + ": "
        + Optional.ofNullable(cause.getMessage()).orElse("(no message)");
  }

  private String buildOtpMessage(String otp, String purpose) {
    return "Hi,\n\n"
        + "Your IQMS one-time verification code is: " + otp + "\n"
        + "Purpose: " + purpose + "\n"
        + "This code expires in 10 minutes.\n\n"
        + "If you did not request this, you can ignore this email.";
  }

  private String maskEmail(String email) {
    if (email == null || !email.contains("@")) {
      return "***";
    }

    String[] parts = email.split("@", 2);
    String local = parts[0];
    if (local.length() <= 2) {
      return "**@" + parts[1];
    }
    return local.substring(0, 2) + "***@" + parts[1];
  }
}
