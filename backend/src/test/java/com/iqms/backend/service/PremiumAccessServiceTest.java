package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PremiumAccessServiceTest {

  @Mock private UserRepository userRepository;

  private PremiumAccessService premiumAccessService;

  @BeforeEach
  void setUp() {
    premiumAccessService = new PremiumAccessService(userRepository);
  }

  @Test
  void freeUserOverFreeQuestionLimitThrowsBadRequest() {
    User user = new User();
    user.setPremiumUntil(null);
    user.setPremiumTrialEndsAt(null);

    List<Map<String, Object>> topics = List.of(
        Map.of(
            "title", "Arrays",
            "subTopics", List.of(
                Map.of(
                    "title", "Basics",
                    "questions", java.util.stream.IntStream.range(0, 101)
                        .mapToObj(index -> Map.of("text", "Question " + index))
                        .toList()))));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> premiumAccessService.assertFreeLimits(user, topics));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.BAD_REQUEST.value());
    assertThat(ex.getReason()).isEqualTo("Free plan supports up to 100 questions.");
  }

  @Test
  void premiumUserWithinPremiumLimitsPassesValidation() {
    User user = new User();
    user.setPremiumUntil(Instant.now().plusSeconds(3600));

    List<Map<String, Object>> topics = List.of(
        Map.of(
            "title", "Dynamic Programming",
            "subTopics", List.of(
                Map.of(
                    "title", "Knapsack",
                    "questions", java.util.stream.IntStream.range(0, 1000)
                        .mapToObj(index -> Map.of("text", "Question " + index))
                        .toList()))));

    assertDoesNotThrow(() -> premiumAccessService.assertFreeLimits(user, topics));
  }

  @Test
  void questionOverWordLimitThrowsBadRequest() {
    User user = new User();

    String longQuestion = String.join(" ", java.util.Collections.nCopies(51, "word"));

    List<Map<String, Object>> topics = List.of(
        Map.of(
            "title", "Graphs",
            "subTopics", List.of(
                Map.of(
                    "title", "Shortest Path",
                    "questions", List.of(Map.of("text", longQuestion))))));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> premiumAccessService.assertFreeLimits(user, topics));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.BAD_REQUEST.value());
    assertThat(ex.getReason()).isEqualTo("Question text supports up to 50 words.");
  }
}
