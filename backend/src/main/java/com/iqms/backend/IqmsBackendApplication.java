package com.iqms.backend;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IqmsBackendApplication {

  public static void main(String[] args) {
    loadDotEnvIfPresent();
    SpringApplication.run(IqmsBackendApplication.class, args);
  }

  private static void loadDotEnvIfPresent() {
    List<Path> candidates = List.of(Path.of(".env"), Path.of("backend/.env"));
    for (Path candidate : candidates) {
      if (!Files.exists(candidate) || !Files.isRegularFile(candidate)) {
        continue;
      }

      try {
        for (String line : Files.readAllLines(candidate)) {
          String trimmed = line == null ? "" : line.trim();
          if (trimmed.isBlank() || trimmed.startsWith("#")) {
            continue;
          }

          int separator = trimmed.indexOf('=');
          if (separator <= 0) {
            continue;
          }

          String key = trimmed.substring(0, separator).trim();
          if (key.isBlank()) {
            continue;
          }

          if (System.getProperty(key) != null || System.getenv(key) != null) {
            continue;
          }

          String rawValue = trimmed.substring(separator + 1).trim();
          String normalizedValue = stripOptionalQuotes(rawValue);
          System.setProperty(key, normalizedValue);
        }
        break;
      } catch (IOException ignored) {
        // Fallback to existing environment/system properties.
      }
    }
  }

  private static String stripOptionalQuotes(String value) {
    if (value == null || value.length() < 2) {
      return value == null ? "" : value;
    }

    boolean wrappedInDoubleQuotes = value.startsWith("\"") && value.endsWith("\"");
    boolean wrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");

    if (wrappedInDoubleQuotes || wrappedInSingleQuotes) {
      return value.substring(1, value.length() - 1);
    }

    return value;
  }
}
