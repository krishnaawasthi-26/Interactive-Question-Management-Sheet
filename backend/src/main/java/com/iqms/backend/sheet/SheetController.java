package com.iqms.backend.sheet;

import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sheets")
public class SheetController {

  private final SheetService sheetService;
  private final CurrentUser currentUser;
  private final UserRepository userRepository;

  public SheetController(SheetService sheetService, CurrentUser currentUser, UserRepository userRepository) {
    this.sheetService = sheetService;
    this.currentUser = currentUser;
    this.userRepository = userRepository;
  }

  @GetMapping
  public ResponseEntity<List<Sheet>> listSheets(HttpServletRequest request) {
    return ResponseEntity.ok(sheetService.listSheetsForOwner(currentUser.getUserId(request)));
  }

  @PostMapping
  public ResponseEntity<Sheet> createSheet(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    String title = body.get("title") == null ? null : body.get("title").toString();
    return ResponseEntity.ok(sheetService.createSheet(currentUser.getUserId(request), title));
  }

  @GetMapping("/{sheetId}")
  public ResponseEntity<Sheet> getSheet(HttpServletRequest request, @PathVariable String sheetId) {
    return ResponseEntity.ok(sheetService.getOwnedSheet(currentUser.getUserId(request), sheetId));
  }

  @PutMapping("/{sheetId}")
  public ResponseEntity<Sheet> updateSheet(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody Map<String, Object> body) {
    String title = body.get("title") == null ? null : body.get("title").toString();
    List<Map<String, Object>> topics = parseTopics(body.get("topics"));
    Boolean isPublic = parseBoolean(body.get("isPublic"));
    Boolean isArchived = parseBoolean(body.get("isArchived"));
    return ResponseEntity.ok(
        sheetService.updateOwnedSheet(currentUser.getUserId(request), sheetId, title, topics, isPublic, isArchived));
  }

  private List<Map<String, Object>> parseTopics(Object topicsValue) {
    if (!(topicsValue instanceof List<?> rawTopics)) {
      return Collections.emptyList();
    }

    return rawTopics.stream()
        .filter(Map.class::isInstance)
        .map(topic -> (Map<String, Object>) topic)
        .toList();
  }

  private Boolean parseBoolean(Object value) {
    if (value == null) return null;
    if (value instanceof Boolean booleanValue) return booleanValue;
    return Boolean.parseBoolean(value.toString());
  }

  @DeleteMapping("/{sheetId}")
  public ResponseEntity<Void> deleteSheet(HttpServletRequest request, @PathVariable String sheetId) {
    sheetService.deleteOwnedSheet(currentUser.getUserId(request), sheetId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/shared/{shareId}")
  public ResponseEntity<Sheet> getSharedSheet(@PathVariable String shareId) {
    return ResponseEntity.ok(sheetService.getByShareId(shareId));
  }

  @PostMapping("/{sheetId}/engagement")
  public ResponseEntity<Map<String, Object>> trackEngagement(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody Map<String, String> body) {
    User user = userRepository.findById(currentUser.getUserId(request))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    String action = body.getOrDefault("action", "").trim().toLowerCase();
    String username = user.getUsername();
    Sheet sheet;
    if ("download".equals(action)) {
      sheet = sheetService.recordDownload(sheetId, username);
    } else if ("copy".equals(action)) {
      sheet = sheetService.recordCopy(sheetId, username);
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown action.");
    }
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("sheetId", sheet.getId());
    payload.put("downloadCount", sheet.getDownloadedByUsernames() == null ? 0 : sheet.getDownloadedByUsernames().size());
    payload.put("copyCount", sheet.getCopiedByUsernames() == null ? 0 : sheet.getCopiedByUsernames().size());
    return ResponseEntity.ok(payload);
  }
}
