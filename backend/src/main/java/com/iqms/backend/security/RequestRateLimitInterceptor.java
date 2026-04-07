package com.iqms.backend.security;

import com.iqms.backend.exception.ApiRequestException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RequestRateLimitInterceptor implements HandlerInterceptor {
  private static final int LIMIT = 5;
  private static final long WINDOW_MS = 10_000L;
  private static final long COOLDOWN_MS = 5_000L;

  private final RequestFingerprintService requestFingerprintService;
  private final Map<String, DeviceWindow> windows = new ConcurrentHashMap<>();

  public RequestRateLimitInterceptor(RequestFingerprintService requestFingerprintService) {
    this.requestFingerprintService = requestFingerprintService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    String key = requestFingerprintService.fingerprint(request);
    DeviceWindow window = windows.computeIfAbsent(key, ignored -> new DeviceWindow());
    long now = Instant.now().toEpochMilli();
    synchronized (window) {
      if (window.cooldownUntil > now) {
        long retrySeconds = ceilSeconds(window.cooldownUntil - now);
        throw new ApiRequestException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too many requests. Try after " + retrySeconds + " seconds.",
            "REQUEST_COOLDOWN",
            retrySeconds,
            window.cooldownUntil);
      }

      while (!window.requestTimestamps.isEmpty() && now - window.requestTimestamps.peekFirst() > WINDOW_MS) {
        window.requestTimestamps.removeFirst();
      }

      if (window.requestTimestamps.size() >= LIMIT) {
        window.cooldownUntil = now + COOLDOWN_MS;
        long retrySeconds = ceilSeconds(COOLDOWN_MS);
        throw new ApiRequestException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too many requests. Try after 5 seconds.",
            "REQUEST_COOLDOWN",
            retrySeconds,
            window.cooldownUntil);
      }

      window.requestTimestamps.addLast(now);
    }
    return true;
  }

  private long ceilSeconds(long millis) {
    return (millis + 999L) / 1000L;
  }

  private static class DeviceWindow {
    private final ArrayDeque<Long> requestTimestamps = new ArrayDeque<>();
    private long cooldownUntil;
  }
}
