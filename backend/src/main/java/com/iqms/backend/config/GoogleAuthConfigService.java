package com.iqms.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleAuthConfigService {
  private static final Logger log = LoggerFactory.getLogger(GoogleAuthConfigService.class);

  private final List<String> googleAuthClientIds;

  public GoogleAuthConfigService(
      Environment environment,
      @Value("${app.auth.google-client-id:}") String googleAuthClientId,
      @Value("${app.auth.google-client-ids:}") String googleAuthClientIds) {
    String envPrimary = firstNonBlank(
        environment.getProperty("APP_AUTH_GOOGLE_CLIENT_ID"),
        environment.getProperty("GOOGLE_CLIENT_ID"),
        environment.getProperty("VITE_APP_AUTH_GOOGLE_CLIENT_ID"),
        environment.getProperty("VITE_GOOGLE_CLIENT_ID"));
    String envList = firstNonBlank(
        environment.getProperty("APP_AUTH_GOOGLE_CLIENT_IDS"),
        environment.getProperty("GOOGLE_CLIENT_IDS"),
        environment.getProperty("VITE_APP_AUTH_GOOGLE_CLIENT_IDS"),
        environment.getProperty("VITE_GOOGLE_CLIENT_IDS"));

    this.googleAuthClientIds = Stream.of(
            splitIds(googleAuthClientId).stream(),
            splitIds(googleAuthClientIds).stream(),
            splitIds(envPrimary).stream(),
            splitIds(envList).stream())
        .flatMap(stream -> stream)
        .map(this::normalize)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();

    log.info("[GoogleAuth] Config loaded. enabled={} audiences={}",
        !this.googleAuthClientIds.isEmpty(), this.googleAuthClientIds.size());
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

  private String firstNonBlank(String... candidates) {
    for (String candidate : candidates) {
      if (candidate != null && !candidate.isBlank()) {
        return candidate;
      }
    }
    return "";
  }
}
