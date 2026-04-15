package com.iqms.backend.config.properties;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
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
    return getBackendGoogleClientIds();
  }

  public List<String> getBackendGoogleClientIds() {
    Set<String> normalizedClientIds = new LinkedHashSet<>();
    normalizedClientIds.addAll(parseClientIds(clientId));
    normalizedClientIds.addAll(parseClientIds(clientIds));
    return List.copyOf(normalizedClientIds);
  }

  private List<String> parseClientIds(String value) {
    String normalizedValue = value == null ? "" : value;
    if (normalizedValue.isBlank()) {
      return List.of();
    }

    String[] entries = normalizedValue.split(",");
    List<String> parsedClientIds = new ArrayList<>();
    for (String entry : entries) {
      String parsedEntry = stripMatchingQuotes(entry == null ? "" : entry.trim());
      if (!parsedEntry.isBlank()) {
        parsedClientIds.add(parsedEntry);
      }
    }
    return parsedClientIds;
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
