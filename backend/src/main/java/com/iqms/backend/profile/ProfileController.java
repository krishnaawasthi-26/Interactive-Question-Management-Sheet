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
        "profileShareId", user.getProfileShareId(),
        "sheets", sheets));
  }

  @PutMapping
  public ResponseEntity<Map<String, Object>> updateProfile(HttpServletRequest request, @RequestBody Map<String, String> body) {
    User user = findUser(currentUser.getUserId(request));
    String name = body.get("name");
    String email = body.get("email");

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

    User saved = userRepository.save(user);
    return ResponseEntity.ok(Map.of(
        "id", saved.getId(),
        "name", saved.getName(),
        "email", saved.getEmail(),
        "profileShareId", saved.getProfileShareId()));
  }

  @GetMapping("/shared/{profileShareId}")
  public ResponseEntity<Map<String, Object>> getSharedProfile(@PathVariable String profileShareId) {
    User user = userRepository
        .findByProfileShareId(profileShareId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    List<Map<String, Object>> sheets = sheetService.listSheetsForOwner(user.getId()).stream()
        .map(sheet -> Map.of(
            "id", sheet.getId(),
            "title", sheet.getTitle(),
            "shareId", sheet.getShareId(),
            "updatedAt", sheet.getUpdatedAt() == null ? null : sheet.getUpdatedAt().toString()))
        .toList();

    return ResponseEntity.ok(Map.of(
        "name", user.getName(),
        "profileShareId", user.getProfileShareId(),
        "sheets", sheets));
  }

  private User findUser(String id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }
}
