package com.iqms.backend.service;

import com.iqms.backend.exception.ApiRequestException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {
  private static final int MAX_ATTEMPTS = 10;
  private static final long LOCK_MS = 10 * 60 * 1000L;

  private final Map<String, AttemptState> attemptsByDevice = new ConcurrentHashMap<>();

  public void assertLoginAllowed(String deviceKey) {
    AttemptState state = attemptsByDevice.computeIfAbsent(deviceKey, ignored -> new AttemptState());
    long now = Instant.now().toEpochMilli();
    synchronized (state) {
      if (state.lockedUntil > now) {
        long retrySeconds = (state.lockedUntil - now + 999L) / 1000L;
        throw new ApiRequestException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too many wrong attempts. Try after 10 minutes.",
            "LOGIN_LOCKED",
            retrySeconds,
            state.lockedUntil);
      }
    }
  }

  public void recordSuccess(String deviceKey) {
    attemptsByDevice.remove(deviceKey);
  }

  public void recordFailure(String deviceKey) {
    AttemptState state = attemptsByDevice.computeIfAbsent(deviceKey, ignored -> new AttemptState());
    long now = Instant.now().toEpochMilli();
    synchronized (state) {
      if (state.lockedUntil > now) return;
      state.failures += 1;
      if (state.failures >= MAX_ATTEMPTS) {
        state.lockedUntil = now + LOCK_MS;
        state.failures = 0;
      }
    }
  }

  private static class AttemptState {
    private int failures;
    private long lockedUntil;
  }
}
