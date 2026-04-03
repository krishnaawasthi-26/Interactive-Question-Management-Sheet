package com.iqms.backend.profile;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.sheet.Sheet;
import com.iqms.backend.sheet.SheetService;
import jakarta.servlet.http.HttpServletRequest;
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
  private final ProfileShareService profileShareService;

  public ProfileController(
      UserRepository userRepository,
      CurrentUser currentUser,
      SheetService sheetService,
      ProfileShareService profileShareService) {
    this.userRepository = userRepository;
    this.currentUser = currentUser;
    this.sheetService = sheetService;
    this.profileShareService = profileShareService;
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
    return ResponseEntity.ok(profileShareService.getSharedProfile(profileShareId));
  }

  @GetMapping("/public/{username}")
  public ResponseEntity<Map<String, Object>> getPublicProfile(@PathVariable String username) {
    return ResponseEntity.ok(profileShareService.getPublicProfile(username));
  }

  @GetMapping("/public/{username}/{sheetSlug}")
  public ResponseEntity<Sheet> getPublicSheet(@PathVariable String username, @PathVariable String sheetSlug) {
    return ResponseEntity.ok(profileShareService.getPublicSheet(username, sheetSlug));
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
}
