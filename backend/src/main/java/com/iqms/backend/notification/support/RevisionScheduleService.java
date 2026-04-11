package com.iqms.backend.notification.support;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RevisionScheduleService {
  private final List<Integer> intervalsHours;

  public RevisionScheduleService(@Value("${app.revision.intervals-hours:6,24,72,168}") String rawIntervals) {
    this.intervalsHours = parseIntervals(rawIntervals);
  }

  public List<Instant> generateSchedule(Instant startAt) {
    Instant safeStart = startAt == null ? Instant.now() : startAt;
    return intervalsHours.stream().map((hours) -> safeStart.plusSeconds(hours.longValue() * 3600)).toList();
  }

  private List<Integer> parseIntervals(String raw) {
    List<Integer> parsed = new ArrayList<>();
    for (String token : raw.split(",")) {
      try {
        int value = Integer.parseInt(token.trim());
        if (value > 0) parsed.add(value);
      } catch (Exception ignored) {
        // skip invalid
      }
    }
    if (parsed.isEmpty()) return List.of(24, 72, 168);
    return parsed;
  }
}
