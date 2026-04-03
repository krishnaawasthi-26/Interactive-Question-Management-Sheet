package com.iqms.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUser {

  public String getUserId(HttpServletRequest request) {
    Object userId = request.getAttribute(AuthInterceptor.REQUEST_USER_ID);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized.");
    }
    return userId.toString();
  }
}
