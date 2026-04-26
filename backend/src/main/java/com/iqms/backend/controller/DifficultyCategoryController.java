package com.iqms.backend.controller;

import com.iqms.backend.model.DifficultyCategory;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/difficulty-categories")
public class DifficultyCategoryController {
  private static final String HEX_COLOR_REGEX = "^#[0-9a-fA-F]{6}$";

  private final UserRepository userRepository;
  private final CurrentUser currentUser;

  public DifficultyCategoryController(UserRepository userRepository, CurrentUser currentUser) {
    this.userRepository = userRepository;
    this.currentUser = currentUser;
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> list(HttpServletRequest request) {
    User user = findUser(currentUser.getUserId(request));
    Map<String, Object> payload = new LinkedHashMap<>();
    List<Map<String, Object>> defaults = List.of(
        defaultEntry("basic", "Basic", "#64748b", "default"),
        defaultEntry("easy", "Easy", "#22c55e", "default"),
        defaultEntry("medium", "Medium", "#f59e0b", "default"),
        defaultEntry("hard", "Hard", "#ef4444", "default"),
        defaultEntry("learn_concept", "Learn / Concept", "#06b6d4", "extra"),
        defaultEntry("complex", "Complex", "#ec4899", "extra"),
        defaultEntry("impossible", "Impossible", "#7f1d1d", "extra"));
    List<Map<String, Object>> custom = user.getDifficultyCategories().stream().map(entry -> {
      Map<String, Object> mapped = new LinkedHashMap<>();
      mapped.put("id", entry.getId());
      mapped.put("key", "custom_" + entry.getId());
      mapped.put("label", entry.getName());
      mapped.put("color", entry.getColor());
      mapped.put("type", "custom");
      mapped.put("tier", "custom");
      return mapped;
    }).toList();
    payload.put("categories", java.util.stream.Stream.concat(defaults.stream(), custom.stream()).toList());
    return ResponseEntity.ok(payload);
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> create(HttpServletRequest request, @RequestBody(required = false) Map<String, String> body) {
    User user = findUser(currentUser.getUserId(request));
    String name = body == null ? null : body.get("name");
    String color = body == null ? null : body.get("color");
    if (name == null || name.trim().length() < 2 || name.trim().length() > 40) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name must be 2-40 characters.");
    }
    if (color == null || !color.matches(HEX_COLOR_REGEX)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Color must be a hex value like #22c55e.");
    }
    String normalizedName = name.trim();
    boolean duplicate = user.getDifficultyCategories().stream().anyMatch(entry -> entry.getName() != null && entry.getName().trim().equalsIgnoreCase(normalizedName));
    if (duplicate) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists.");
    }

    DifficultyCategory category = new DifficultyCategory();
    category.setId("cat_" + UUID.randomUUID().toString().replace("-", ""));
    category.setName(normalizedName);
    category.setColor(color.trim());
    category.setCreatedAt(Instant.now());
    category.setUpdatedAt(Instant.now());
    user.getDifficultyCategories().add(category);
    userRepository.save(user);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", category.getId());
    payload.put("key", "custom_" + category.getId());
    payload.put("label", category.getName());
    payload.put("color", category.getColor());
    payload.put("type", "custom");
    payload.put("tier", "custom");
    return ResponseEntity.ok(payload);
  }

  private Map<String, Object> defaultEntry(String key, String label, String color, String tier) {
    Map<String, Object> entry = new LinkedHashMap<>();
    entry.put("key", key);
    entry.put("label", label);
    entry.put("color", color);
    entry.put("type", "default");
    entry.put("tier", tier);
    return entry;
  }

  private User findUser(String userId) {
    return userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }
}
