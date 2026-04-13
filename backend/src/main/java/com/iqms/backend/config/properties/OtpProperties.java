package com.iqms.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.auth.otp")
public class OtpProperties {

  private String bypassKey = "";

  public String getBypassKey() {
    return bypassKey;
  }

  public void setBypassKey(String bypassKey) {
    this.bypassKey = normalize(bypassKey);
  }

  private String normalize(String value) {
    return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase();
  }
}
