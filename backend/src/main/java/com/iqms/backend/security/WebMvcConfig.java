package com.iqms.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  private final AuthInterceptor authInterceptor;

  public WebMvcConfig(AuthInterceptor authInterceptor) {
    this.authInterceptor = authInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(authInterceptor)
        .addPathPatterns("/api/profile/**", "/api/sheets/**")
        .excludePathPatterns(
            "/api/profile/shared/**",
            "/api/profile/public/**",
            "/api/sheets/shared/**",
            "/api/sheets/profile/shared/**");
  }
}
