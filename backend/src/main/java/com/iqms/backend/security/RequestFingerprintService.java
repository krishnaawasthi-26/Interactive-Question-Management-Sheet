package com.iqms.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class RequestFingerprintService {

  public String fingerprint(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    String ip = forwarded != null && !forwarded.isBlank()
        ? forwarded.split(",")[0].trim()
        : request.getRemoteAddr();
    String userAgent = request.getHeader("User-Agent");
    String normalizedUa = userAgent == null ? "unknown" : userAgent.trim().toLowerCase();
    return ip + "|" + normalizedUa;
  }
}
