package com.iqms.backend.profile;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.sheet.Sheet;
import com.iqms.backend.sheet.SheetService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

  private final UserRepository userRepository;
  private final CurrentUser currentUser;
  private final SheetService sheetService;

  public ProfileController(UserRepository userRepository, CurrentUser currentUser, SheetService sheetService) {
    this.userRepository = userRepository;
    this.currentUser = currentUser;
    this.sheetService = sheetService;
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> getProfile(HttpServletRequest request) {
    User user = findUser(currentUser.getUserId(request));
    List<Sheet> sheets = sheetService.listSheetsForOwner(user.getId());
    return ResponseEntity.ok(Map.of(
        "id", user.getId(),
        "name", user.getName(),
        "email", user.getEmail(),
        "username", user.getUsername(),
        "profileShareId", user.getProfileShareId(),
        "sheets", sheets));
  }

  @PutMapping
  public ResponseEntity<Map<String, Object>> updateProfile(HttpServletRequest request, @RequestBody Map<String, String> body) {
    User user = findUser(currentUser.getUserId(request));
    String name = body.get("name");
    String email = body.get("email");
    String username = body.get("username");

    if (name != null && !name.isBlank()) {
      user.setName(name.trim());
    }

    if (email != null && !email.isBlank()) {
      String normalizedEmail = email.trim().toLowerCase();
      userRepository
          .findByEmail(normalizedEmail)
          .filter(found -> !found.getId().equals(user.getId()))
          .ifPresent(found -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use.");
          });
      user.setEmail(normalizedEmail);
    }

    if (username != null && !username.isBlank()) {
      String normalizedUsername = normalizeUsername(username);
      userRepository
          .findByUsername(normalizedUsername)
          .filter(found -> !found.getId().equals(user.getId()))
          .ifPresent(found -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
          });
      user.setUsername(normalizedUsername);
    }

    User saved = userRepository.save(user);
    return ResponseEntity.ok(Map.of(
        "id", saved.getId(),
        "name", saved.getName(),
        "email", saved.getEmail(),
        "username", saved.getUsername(),
        "profileShareId", saved.getProfileShareId()));
  }

  @GetMapping("/shared/{profileShareId}")
  public ResponseEntity<Map<String, Object>> getSharedProfile(@PathVariable String profileShareId) {
    User user = userRepository
        .findByProfileShareId(profileShareId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    List<Map<String, Object>> sheets = sheetService.listSheetsForOwner(user.getId()).stream()
        .map(sheet -> {
          Map<String, Object> sharedSheet = new LinkedHashMap<>();
          sharedSheet.put("id", sheet.getId());
          sharedSheet.put("title", sheet.getTitle());
          sharedSheet.put("shareId", sheet.getShareId());
          sharedSheet.put("updatedAt", sheet.getUpdatedAt() == null ? null : sheet.getUpdatedAt().toString());
          return sharedSheet;
        })
        .toList();

    return ResponseEntity.ok(Map.of(
        "name", user.getName(),
        "username", user.getUsername(),
        "profileShareId", user.getProfileShareId(),
        "sheets", sheets));
  }

  @GetMapping("/public/{username}")
  public ResponseEntity<Map<String, Object>> getPublicProfile(@PathVariable String username) {
    User user = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    List<Map<String, Object>> sheets = sheetService.listSheetsForOwner(user.getId()).stream()
        .map(sheet -> {
          Map<String, Object> sharedSheet = new LinkedHashMap<>();
          sharedSheet.put("id", sheet.getId());
          sharedSheet.put("title", sheet.getTitle());
          sharedSheet.put("sheetSlug", toSlug(sheet.getTitle()));
          sharedSheet.put("shareId", sheet.getShareId());
          sharedSheet.put("updatedAt", sheet.getUpdatedAt() == null ? null : sheet.getUpdatedAt().toString());
          return sharedSheet;
        })
        .toList();

    return ResponseEntity.ok(Map.of(
        "name", user.getName(),
        "username", user.getUsername(),
        "sheets", sheets));
  }

  @GetMapping("/public/{username}/{sheetSlug}")
  public ResponseEntity<Sheet> getPublicSheet(@PathVariable String username, @PathVariable String sheetSlug) {
    User user = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    Sheet sheet = sheetService.listSheetsForOwner(user.getId()).stream()
        .filter(found -> toSlug(found.getTitle()).equals(sheetSlug.toLowerCase()))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));

    return ResponseEntity.ok(sheet);
  }

  private User findUser(String id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }

  private String normalizeUsername(String username) {
    String normalized = username.trim().toLowerCase();
    if (!normalized.matches("^[a-z0-9_\\-]{3,30}$")) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Username can use lowercase letters, numbers, _ and - (3-30 chars).");
    }
    return normalized;
  }

  private String toSlug(String input) {
    if (input == null || input.isBlank()) return "untitled-sheet";
    String normalized = input.trim().toLowerCase();
    String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return slug.isBlank() ? "untitled-sheet" : slug;
  }
}
