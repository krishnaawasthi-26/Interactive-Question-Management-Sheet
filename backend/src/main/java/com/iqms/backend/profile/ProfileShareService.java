package com.iqms.backend.profile;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.sheet.Sheet;
import com.iqms.backend.sheet.SheetService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileShareService {

  private final UserRepository userRepository;
  private final SheetService sheetService;

  public ProfileShareService(UserRepository userRepository, SheetService sheetService) {
    this.userRepository = userRepository;
    this.sheetService = sheetService;
  }

  public Map<String, Object> getSharedProfile(String profileShareId) {
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

    return Map.of(
        "name", user.getName(),
        "username", user.getUsername(),
        "profileShareId", user.getProfileShareId(),
        "sheets", sheets);
  }

  public Map<String, Object> getPublicProfile(String username) {
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

    return Map.of(
        "name", user.getName(),
        "username", user.getUsername(),
        "sheets", sheets);
  }

  public Sheet getPublicSheet(String username, String sheetSlug) {
    User user = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    return sheetService.listSheetsForOwner(user.getId()).stream()
        .filter(found -> toSlug(found.getTitle()).equals(sheetSlug.toLowerCase()))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
  }

  private String toSlug(String input) {
    if (input == null || input.isBlank()) return "untitled-sheet";
    String normalized = input.trim().toLowerCase();
    String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return slug.isBlank() ? "untitled-sheet" : slug;
  }
}
