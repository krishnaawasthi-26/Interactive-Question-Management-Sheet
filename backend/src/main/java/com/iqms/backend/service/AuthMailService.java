package com.iqms.backend.service;

import com.iqms.backend.config.properties.MailProperties;
import com.iqms.backend.exception.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AuthMailService {

  private final JavaMailSender mailSender;
  private final MailProperties mailProperties;

  public AuthMailService(JavaMailSender mailSender, MailProperties mailProperties) {
    this.mailSender = mailSender;
    this.mailProperties = mailProperties;
  }

  public void sendSignupOtp(String to, String otp) {
    if (!mailProperties.isEnabled()) {
      return;
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(to);
    message.setSubject("Your Create Sheets verification code");
    message.setText("Your verification code is " + otp + ". It expires in 10 minutes.");

    String fromAddress = hasText(mailProperties.getFromAddress())
        ? mailProperties.getFromAddress()
        : mailProperties.getUsername();
    if (hasText(fromAddress)) {
      message.setFrom(fromAddress);
    }

    try {
      mailSender.send(message);
    } catch (MailException ex) {
      throw new ApiRequestException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Unable to send verification email right now. Please try again.",
          "OTP_EMAIL_SEND_FAILED",
          null,
          null);
    }
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
