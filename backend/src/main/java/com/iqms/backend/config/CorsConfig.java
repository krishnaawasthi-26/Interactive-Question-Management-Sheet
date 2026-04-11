package com.iqms.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

  private static final List<String> DEFAULT_ALLOWED_ORIGINS =
      List.of("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174");

  private static final List<String> DEFAULT_ALLOWED_ORIGIN_PATTERNS =
      List.of("http://localhost:*", "http://127.0.0.1:*", "https://*.vercel.app");

  private final List<String> allowedOrigins;
  private final List<String> allowedOriginPatterns;

  public CorsConfig(
      @Value("${app.cors.allowed-origins:}") String allowedOrigins,
      @Value("${app.cors.allowed-origin-patterns:}") String allowedOriginPatterns) {
    this.allowedOrigins = normalizeCsv(allowedOrigins, DEFAULT_ALLOWED_ORIGINS);
    this.allowedOriginPatterns =
        normalizeCsv(allowedOriginPatterns, DEFAULT_ALLOWED_ORIGIN_PATTERNS);
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.setAllowedOrigins(allowedOrigins);
    config.setAllowedOriginPatterns(allowedOriginPatterns);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
    config.setExposedHeaders(List.of("Authorization"));
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  private List<String> normalizeCsv(String csv, List<String> fallback) {
    if (csv == null || csv.isBlank()) {
      return fallback;
    }

    List<String> parsed =
        Arrays.stream(csv.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .flatMap(this::expandIfWildcardOrigin)
            .distinct()
            .toList();

    return parsed.isEmpty() ? fallback : parsed;
  }

  private Stream<String> expandIfWildcardOrigin(String value) {
    if ("*".equals(value)) {
      return Stream.of();
    }
    return Stream.of(value);
  }
}
