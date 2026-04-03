package com.iqms.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

  public static final String REQUEST_USER_ID = "authenticatedUserId";
  private final TokenService tokenService;

  public AuthInterceptor(TokenService tokenService) {
    this.tokenService = tokenService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing authorization token.");
      return false;
    }

    String token = authHeader.substring("Bearer ".length());
    return tokenService
        .validateAndGetUserId(token)
        .map(userId -> {
          request.setAttribute(REQUEST_USER_ID, userId);
          return true;
        })
        .orElseGet(() -> {
          try {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid or expired authorization token.");
          } catch (Exception ignored) {
            // no-op
          }
          return false;
        });
  }
}
