package com.iqms.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@Validated
@ConfigurationProperties(prefix = "app.payment.razorpay")
public class RazorpayProperties {

  private boolean enabled = true;
  private String keyId;
  private String keySecret;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getKeyId() {
    return keyId;
  }

  public void setKeyId(String keyId) {
    this.keyId = keyId == null ? "" : keyId.trim();
  }

  public String getKeySecret() {
    return keySecret;
  }

  public void setKeySecret(String keySecret) {
    this.keySecret = keySecret == null ? "" : keySecret.trim();
  }
}
