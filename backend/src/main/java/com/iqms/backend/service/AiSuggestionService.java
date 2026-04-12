package com.iqms.backend.service;

import com.iqms.backend.model.Sheet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AiSuggestionService {

  public Map<String, Object> suggestNext(Sheet sheet) {
    Map<String, Object> response = new LinkedHashMap<>();
    int totalQuestions = 0;
    int completed = 0;

    for (Map<String, Object> topic : sheet.getTopics()) {
      Object subTopicsRaw = topic.get("subTopics");
      if (!(subTopicsRaw instanceof List<?> subTopics)) continue;
      for (Object subObj : subTopics) {
        if (!(subObj instanceof Map<?, ?> subMap)) continue;
        Object qRaw = subMap.get("questions");
        if (!(qRaw instanceof List<?> questions)) continue;
        for (Object qObj : questions) {
          totalQuestions++;
          if (qObj instanceof Map<?, ?> qMap && Boolean.TRUE.equals(qMap.get("done"))) {
            completed++;
          }
        }
      }
    }

    if (totalQuestions == 0) {
      response.put("message", "Not enough data to generate AI guidance yet. Add some questions first.");
      response.put("recommendations", List.of());
      return response;
    }

    int remaining = Math.max(0, totalQuestions - completed);
    response.put("message", "Based on completion and revision signal, continue with remaining high-priority items.");
    response.put("why", "You have " + remaining + " remaining out of " + totalQuestions + " questions.");
    response.put("recommendations", List.of(
        Map.of("action", "focus_remaining", "priority", "high", "count", remaining),
        Map.of("action", "review_completed", "priority", "medium", "count", completed)));
    return response;
  }
}
