package com.iqms.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleAuthConfigService {

  private final List<String> googleAuthClientIds;

  public GoogleAuthConfigService(
      @Value("${app.auth.google-client-id:}") String googleAuthClientId,
      @Value("${app.auth.google-client-ids:}") String googleAuthClientIds) {
    this.googleAuthClientIds = Stream.concat(splitIds(googleAuthClientId).stream(), splitIds(googleAuthClientIds).stream())
        .map(this::normalize)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();
  }

  public List<String> getGoogleAuthClientIds() {
    return List.copyOf(googleAuthClientIds);
  }

  public String getPrimaryGoogleAuthClientId() {
    return googleAuthClientIds.isEmpty() ? "" : googleAuthClientIds.get(0);
  }

  public boolean isGoogleAuthEnabled() {
    return !googleAuthClientIds.isEmpty();
  }

  private List<String> splitIds(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }

    return Arrays.stream(raw.split(","))
        .map(this::normalize)
        .filter(value -> !value.isBlank())
        .toList();
  }

  private String normalize(String value) {
    return Objects.toString(value, "").trim();
  }
}
