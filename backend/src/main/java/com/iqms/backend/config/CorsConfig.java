package com.iqms.backend.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

  private final List<String> allowedOrigins;
  private final List<String> allowedOriginPatterns;

  public CorsConfig(
      @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
          List<String> allowedOrigins,
      @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*,https://*.vercel.app}")
          List<String> allowedOriginPatterns) {
    this.allowedOrigins = allowedOrigins;
    this.allowedOriginPatterns = allowedOriginPatterns;
  }

  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.toArray(new String[0]))
            .allowedOriginPatterns(allowedOriginPatterns.toArray(new String[0]))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Authorization")
            .allowCredentials(true)
            .maxAge(3600);
      }
    };
  }
}
