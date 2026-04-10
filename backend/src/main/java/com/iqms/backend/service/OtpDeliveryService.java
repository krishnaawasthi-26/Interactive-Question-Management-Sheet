package com.iqms.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class OtpDeliveryService {
  private static final Logger LOGGER = LoggerFactory.getLogger(OtpDeliveryService.class);

  public void sendOtp(String email, String purpose, String otp) {
    LOGGER.info("OTP generated for {} ({}): {}", email, purpose, otp);
  }
}
