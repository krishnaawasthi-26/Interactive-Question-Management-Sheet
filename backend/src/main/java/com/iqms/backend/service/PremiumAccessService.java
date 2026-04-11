package com.iqms.backend.service;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PremiumAccessService {
  public static final int FREE_TOPIC_LIMIT = 30;
  public static final int FREE_SUBTOPIC_LIMIT = 50;
  public static final int FREE_QUESTION_LIMIT = 100;

  private final UserRepository userRepository;

  public PremiumAccessService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User findUser(String userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }

  public boolean isPremiumActive(User user) {
    Instant now = Instant.now();
    Instant premiumUntil = user.getPremiumUntil();
    Instant trialUntil = user.getPremiumTrialEndsAt();
    return (premiumUntil != null && premiumUntil.isAfter(now)) || (trialUntil != null && trialUntil.isAfter(now));
  }

  public void assertPremiumFeatureAllowed(User user, String featureName) {
    if (isPremiumActive(user)) return;
    throw new ResponseStatusException(
        HttpStatus.PAYMENT_REQUIRED,
        featureName + " is a premium feature. Please buy premium to continue.");
  }

  public void assertFreeLimits(User user, List<Map<String, Object>> topics) {
    if (topics == null || isPremiumActive(user)) return;

    int topicCount = topics.size();
    int subTopicCount = 0;
    int questionCount = 0;

    for (Map<String, Object> topic : topics) {
      Object subTopicsRaw = topic.get("subTopics");
      if (!(subTopicsRaw instanceof List<?> subTopics)) continue;
      subTopicCount += subTopics.size();

      for (Object subObj : subTopics) {
        if (!(subObj instanceof Map<?, ?> subTopicMap)) continue;
        Object questionsRaw = subTopicMap.get("questions");
        if (questionsRaw instanceof List<?> questions) {
          questionCount += questions.size();
        }
      }
    }

    if (topicCount > FREE_TOPIC_LIMIT) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Free plan supports up to 30 topics.");
    }
    if (subTopicCount > FREE_SUBTOPIC_LIMIT) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Free plan supports up to 50 subtopics.");
    }
    if (questionCount > FREE_QUESTION_LIMIT) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Free plan supports up to 100 questions.");
    }
  }
}
