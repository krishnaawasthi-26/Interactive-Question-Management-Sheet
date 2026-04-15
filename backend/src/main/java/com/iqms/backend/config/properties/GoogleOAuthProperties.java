package com.iqms.backend.config.properties;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.auth.google")
public class GoogleOAuthProperties {

  private String clientId;

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId == null ? "" : clientId.trim();
  }

  public String getPrimaryClientId() {
    List<String> configuredClientIds = getClientIds();
    return configuredClientIds.isEmpty() ? "" : configuredClientIds.get(0);
  }

  public List<String> getClientIds() {
    if (clientId == null || clientId.isBlank()) {
      return List.of();
    }
    return Arrays.stream(clientId.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .toList();
  }
}
