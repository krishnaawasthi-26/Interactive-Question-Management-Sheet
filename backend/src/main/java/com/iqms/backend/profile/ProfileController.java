package com.iqms.backend.profile;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.sheet.Sheet;
import com.iqms.backend.sheet.SheetService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    Map<String, Object> payload = profilePayload(user);
    payload.put("sheets", sheets);
    return ResponseEntity.ok(payload);
  }

  @PutMapping
  public ResponseEntity<Map<String, Object>> updateProfile(HttpServletRequest request, @RequestBody Map<String, String> body) {
    User user = findUser(currentUser.getUserId(request));
    String name = body.get("name");
    String email = body.get("email");
    String username = body.get("username");
    String bio = body.get("bio");
    String institution = body.get("institution");
    String company = body.get("company");
    String websiteUrl = body.get("websiteUrl");
    String githubUrl = body.get("githubUrl");
    String linkedinUrl = body.get("linkedinUrl");

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

    if (bio != null) user.setBio(normalizeOptionalValue(bio));
    if (institution != null) user.setInstitution(normalizeOptionalValue(institution));
    if (company != null) user.setCompany(normalizeOptionalValue(company));
    if (websiteUrl != null) user.setWebsiteUrl(normalizeOptionalValue(websiteUrl));
    if (githubUrl != null) user.setGithubUrl(normalizeOptionalValue(githubUrl));
    if (linkedinUrl != null) user.setLinkedinUrl(normalizeOptionalValue(linkedinUrl));

    User saved = userRepository.save(user);
    return ResponseEntity.ok(profilePayload(saved));
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

  @PostMapping("/follow/{username}")
  public ResponseEntity<Map<String, Object>> followUser(HttpServletRequest request, @PathVariable String username) {
    User actor = findUser(currentUser.getUserId(request));
    User target = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

    if (actor.getId().equals(target.getId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot follow yourself.");
    }

    if (actor.getFollowingUserIds().add(target.getId())) {
      target.getFollowerUserIds().add(actor.getId());
      userRepository.save(actor);
      userRepository.save(target);
    }

    return ResponseEntity.ok(buildFollowResponse(actor, target));
  }

  @DeleteMapping("/follow/{username}")
  public ResponseEntity<Map<String, Object>> unfollowUser(HttpServletRequest request, @PathVariable String username) {
    User actor = findUser(currentUser.getUserId(request));
    User target = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

    if (actor.getFollowingUserIds().remove(target.getId())) {
      target.getFollowerUserIds().remove(actor.getId());
      userRepository.save(actor);
      userRepository.save(target);
    }

    return ResponseEntity.ok(buildFollowResponse(actor, target));
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

  private String normalizeOptionalValue(String value) {
    String normalized = value.trim();
    return normalized.isBlank() ? null : normalized;
  }

  private Map<String, Object> profilePayload(User user) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", user.getId());
    payload.put("name", user.getName());
    payload.put("email", user.getEmail());
    payload.put("username", user.getUsername());
    payload.put("profileShareId", user.getProfileShareId());
    payload.put("bio", user.getBio());
    payload.put("institution", user.getInstitution());
    payload.put("company", user.getCompany());
    payload.put("websiteUrl", user.getWebsiteUrl());
    payload.put("githubUrl", user.getGithubUrl());
    payload.put("linkedinUrl", user.getLinkedinUrl());
    payload.put("followers", mapUsersById(user.getFollowerUserIds()));
    payload.put("following", mapUsersById(user.getFollowingUserIds()));
    payload.put("followersCount", user.getFollowerUserIds() == null ? 0 : user.getFollowerUserIds().size());
    payload.put("followingCount", user.getFollowingUserIds() == null ? 0 : user.getFollowingUserIds().size());
    payload.put("copiedSheetsCount", user.getCopiedSheetIds() == null ? 0 : user.getCopiedSheetIds().size());
    return payload;
  }

  private Map<String, Object> buildFollowResponse(User actor, User target) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("targetUsername", target.getUsername());
    response.put("isFollowing", actor.getFollowingUserIds().contains(target.getId()));
    response.put("followersCount", target.getFollowerUserIds().size());
    response.put("followingCount", target.getFollowingUserIds().size());
    return response;
  }

  private List<Map<String, Object>> mapUsersById(Set<String> ids) {
    if (ids == null || ids.isEmpty()) return List.of();

    List<User> users = userRepository.findAllById(ids);
    Map<String, User> usersById = new HashMap<>();
    for (User user : users) {
      usersById.put(user.getId(), user);
    }

    List<Map<String, Object>> mapped = new ArrayList<>();
    for (String id : ids) {
      User user = usersById.get(id);
      if (user == null) continue;
      Map<String, Object> entry = new LinkedHashMap<>();
      entry.put("id", user.getId());
      entry.put("name", user.getName());
      entry.put("username", user.getUsername());
      mapped.add(entry);
    }
    return mapped;
  }
}
