package com.iqms.backend.config.properties;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.auth.google")
public class GoogleOAuthProperties {

  private String clientId;
  private String clientIds;

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId == null ? "" : clientId.trim();
  }

  public void setClientIds(String clientIds) {
    this.clientIds = clientIds == null ? "" : clientIds.trim();
  }

  public String getPrimaryClientId() {
    List<String> configuredClientIds = getClientIds();
    return configuredClientIds.isEmpty() ? "" : configuredClientIds.get(0);
  }

  public List<String> getClientIds() {
    return Arrays.stream(((clientId == null ? "" : clientId) + "," + (clientIds == null ? "" : clientIds)).split(","))
        .map(String::trim)
        .map(this::stripMatchingQuotes)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();
  }

  private String stripMatchingQuotes(String value) {
    if (value.length() >= 2) {
      boolean wrappedInDoubleQuotes = value.startsWith("\"") && value.endsWith("\"");
      boolean wrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");
      if (wrappedInDoubleQuotes || wrappedInSingleQuotes) {
        return value.substring(1, value.length() - 1).trim();
      }
    }
    return value;
  }
}
