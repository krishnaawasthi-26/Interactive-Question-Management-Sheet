package com.iqms.backend.service;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PremiumAccessService {
  public static final String PREMIUM_SOURCE_PAID = "paid";
  public static final String PREMIUM_SOURCE_TRIAL = "trial";
  public static final String PREMIUM_SOURCE_NONE = "none";
  public static final String NEW_USER_TRIAL_REASON = "new_user_trial";
  private static final Duration NEW_USER_TRIAL_DURATION = Duration.ofDays(7);

  public static final int FREE_TOPIC_LIMIT = 30;
  public static final int FREE_SUBTOPIC_LIMIT = 50;
  public static final int FREE_QUESTION_LIMIT = 100;
  public static final int PREMIUM_TOPIC_LIMIT = 100;
  public static final int PREMIUM_SUBTOPIC_LIMIT = 200;
  public static final int PREMIUM_QUESTION_LIMIT = 1000;
  public static final int MAX_WORDS_PER_ENTRY = 50;

  private final UserRepository userRepository;

  public PremiumAccessService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User findUser(String userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }

  public PremiumAccessState resolveAccessState(User user) {
    Instant now = Instant.now();
    Instant paidUntil = user.getPremiumUntil();
    Instant trialUntil = user.getPremiumTrialEndsAt();

    boolean paidActive = paidUntil != null && paidUntil.isAfter(now);
    boolean trialActive = trialUntil != null && trialUntil.isAfter(now);
    boolean premiumActive = paidActive || trialActive;

    String source = PREMIUM_SOURCE_NONE;
    Instant premiumExpiresAt = null;
    if (paidActive) {
      source = PREMIUM_SOURCE_PAID;
      premiumExpiresAt = paidUntil;
    } else if (trialActive) {
      source = PREMIUM_SOURCE_TRIAL;
      premiumExpiresAt = trialUntil;
    }

    return new PremiumAccessState(
        premiumActive,
        source,
        paidActive,
        trialActive,
        paidUntil,
        user.getPremiumTrialStartedAt(),
        trialUntil,
        premiumExpiresAt,
        user.getPremiumGrantedReason(),
        user.getHadFreePremiumTrial());
  }

  public boolean isPremiumActive(User user) {
    return resolveAccessState(user).premiumActive();
  }

  public boolean grantNewUserTrialIfEligible(User user) {
    PremiumAccessState state = resolveAccessState(user);
    if (state.hadFreePremiumTrial() || state.trialActive() || state.paidActive()) {
      return false;
    }

    Instant now = Instant.now();
    user.setPremiumTrialStartedAt(now);
    user.setPremiumTrialEndsAt(now.plus(NEW_USER_TRIAL_DURATION));
    user.setPremiumGrantedReason(NEW_USER_TRIAL_REASON);
    user.setHadFreePremiumTrial(true);
    user.setPremiumTrialWelcomePending(true);
    if (!state.paidActive()) {
      user.setPlanTier("premium_trial");
      user.setSubscriptionStatus("trialing");
    }
    return true;
  }

  public boolean consumeTrialWelcomePopup(User user) {
    if (!user.getPremiumTrialWelcomePending()) {
      return false;
    }
    user.setPremiumTrialWelcomePending(false);
    userRepository.save(user);
    return true;
  }

  public void assertPremiumFeatureAllowed(User user, String featureName) {
    if (isPremiumActive(user)) return;
    throw new ResponseStatusException(
        HttpStatus.PAYMENT_REQUIRED,
        featureName + " is a premium feature. Please buy premium to continue.");
  }

  private int countWords(String value) {
    String trimmed = value == null ? "" : value.trim();
    if (trimmed.isEmpty()) return 0;
    return trimmed.split("\\s+").length;
  }

  public void assertFreeLimits(User user, List<Map<String, Object>> topics) {
    if (topics == null) return;

    boolean premiumActive = isPremiumActive(user);

    int topicCount = topics.size();
    int subTopicCount = 0;
    int questionCount = 0;

    int topicLimit = premiumActive ? PREMIUM_TOPIC_LIMIT : FREE_TOPIC_LIMIT;
    int subTopicLimit = premiumActive ? PREMIUM_SUBTOPIC_LIMIT : FREE_SUBTOPIC_LIMIT;
    int questionLimit = premiumActive ? PREMIUM_QUESTION_LIMIT : FREE_QUESTION_LIMIT;

    for (Map<String, Object> topic : topics) {
      Object topicTitle = topic.get("title");
      if (topicTitle instanceof String topicTitleText && countWords(topicTitleText) > MAX_WORDS_PER_ENTRY) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Topic title supports up to " + MAX_WORDS_PER_ENTRY + " words.");
      }

      Object subTopicsRaw = topic.get("subTopics");
      if (!(subTopicsRaw instanceof List<?> subTopics)) continue;
      subTopicCount += subTopics.size();

      for (Object subObj : subTopics) {
        if (!(subObj instanceof Map<?, ?> subTopicMap)) continue;

        Object subTopicTitle = subTopicMap.get("title");
        if (subTopicTitle instanceof String subTopicTitleText && countWords(subTopicTitleText) > MAX_WORDS_PER_ENTRY) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Subtopic title supports up to " + MAX_WORDS_PER_ENTRY + " words.");
        }

        Object questionsRaw = subTopicMap.get("questions");
        if (questionsRaw instanceof List<?> questions) {
          questionCount += questions.size();

          for (Object questionObj : questions) {
            if (!(questionObj instanceof Map<?, ?> questionMap)) continue;
            Object questionText = questionMap.get("text");
            if (questionText instanceof String questionTextValue
                && countWords(questionTextValue) > MAX_WORDS_PER_ENTRY) {
              throw new ResponseStatusException(
                  HttpStatus.BAD_REQUEST,
                  "Question text supports up to " + MAX_WORDS_PER_ENTRY + " words.");
            }
          }
        }
      }
    }

    if (topicCount > topicLimit) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          (premiumActive ? "Premium" : "Free") + " plan supports up to " + topicLimit + " topics.");
    }
    if (subTopicCount > subTopicLimit) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          (premiumActive ? "Premium" : "Free") + " plan supports up to " + subTopicLimit + " subtopics.");
    }
    if (questionCount > questionLimit) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          (premiumActive ? "Premium" : "Free") + " plan supports up to " + questionLimit + " questions.");
    }
  }

  public record PremiumAccessState(
      boolean premiumActive,
      String premiumAccessType,
      boolean paidActive,
      boolean trialActive,
      Instant premiumUntil,
      Instant premiumTrialStartedAt,
      Instant premiumTrialEndsAt,
      Instant premiumExpiresAt,
      String premiumGrantedReason,
      boolean hadFreePremiumTrial) {}
}
