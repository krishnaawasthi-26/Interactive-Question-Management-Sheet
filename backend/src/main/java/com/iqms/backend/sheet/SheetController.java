package com.iqms.backend.controller;

import com.iqms.backend.dto.sheet.SheetCreateRequest;
import com.iqms.backend.dto.sheet.SheetEngagementRequest;
import com.iqms.backend.dto.sheet.SheetEngagementResponse;
import com.iqms.backend.dto.sheet.SheetUpdateRequest;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.SheetActivityEvent;
import com.iqms.backend.model.SheetComment;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.AiSuggestionService;
import com.iqms.backend.service.SheetCollaborationService;
import com.iqms.backend.service.SheetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sheets")
public class SheetController {

  private final SheetService sheetService;
  private final CurrentUser currentUser;
  private final SheetCollaborationService collaborationService;
  private final AiSuggestionService aiSuggestionService;

  public SheetController(
      SheetService sheetService,
      CurrentUser currentUser,
      SheetCollaborationService collaborationService,
      AiSuggestionService aiSuggestionService) {
    this.sheetService = sheetService;
    this.currentUser = currentUser;
    this.collaborationService = collaborationService;
    this.aiSuggestionService = aiSuggestionService;
  }

  @GetMapping
  public ResponseEntity<List<Sheet>> listSheets(HttpServletRequest request) {
    return ResponseEntity.ok(sheetService.listSheetsAccessibleBy(currentUser.getUserId(request)));
  }

  @PostMapping
  public ResponseEntity<Sheet> createSheet(HttpServletRequest request, @Valid @RequestBody SheetCreateRequest body) {
    return ResponseEntity.ok(sheetService.createSheet(currentUser.getUserId(request), body.getTitle()));
  }

  @GetMapping("/{sheetId}")
  public ResponseEntity<Sheet> getSheet(HttpServletRequest request, @PathVariable String sheetId) {
    return ResponseEntity.ok(sheetService.getAccessibleSheet(currentUser.getUserId(request), sheetId));
  }

  @PutMapping("/{sheetId}")
  public ResponseEntity<Sheet> updateSheet(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @Valid @RequestBody SheetUpdateRequest body) {
    return ResponseEntity.ok(
        sheetService.updateOwnedSheet(
            currentUser.getUserId(request),
            sheetId,
            body.getTitle(),
            body.getTopics(),
            body.getIsPublic(),
            body.getIsArchived()));
  }

  @PutMapping("/{sheetId}/sharing")
  public ResponseEntity<Sheet> updateSharing(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody Map<String, Object> body) {
    String visibility = null;
    if (body != null) {
      Object visibilityValue = body.get("visibility");
      visibility = visibilityValue == null ? null : String.valueOf(visibilityValue);
    }
    Boolean commentsEnabled = body == null ? null : (body.get("commentsEnabled") instanceof Boolean b ? b : null);
    return ResponseEntity.ok(sheetService.updateSharingSettings(currentUser.getUserId(request), sheetId, visibility, commentsEnabled));
  }

  @PostMapping("/{sheetId}/invite")
  public ResponseEntity<Sheet> inviteCollaborator(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody(required = false) Map<String, String> body) {
    return ResponseEntity.ok(collaborationService.invite(
        currentUser.getUserId(request),
        sheetId,
        bodyValue(body, "username"),
        bodyValue(body, "role")));
  }

  @GetMapping("/{sheetId}/comments")
  public ResponseEntity<List<SheetComment>> comments(HttpServletRequest request, @PathVariable String sheetId) {
    return ResponseEntity.ok(collaborationService.comments(currentUser.getUserId(request), sheetId));
  }

  @PostMapping("/{sheetId}/comments")
  public ResponseEntity<SheetComment> addComment(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody(required = false) Map<String, String> body) {
    return ResponseEntity.ok(collaborationService.addComment(
        currentUser.getUserId(request),
        sheetId,
        bodyValue(body, "content"),
        bodyValue(body, "topicId"),
        bodyValue(body, "subTopicId"),
        bodyValue(body, "questionId")));
  }

  @GetMapping("/{sheetId}/activity")
  public ResponseEntity<List<SheetActivityEvent>> activity(HttpServletRequest request, @PathVariable String sheetId) {
    return ResponseEntity.ok(collaborationService.activity(currentUser.getUserId(request), sheetId));
  }

  @GetMapping("/{sheetId}/ai/suggest-next")
  public ResponseEntity<Map<String, Object>> suggestNext(HttpServletRequest request, @PathVariable String sheetId) {
    Sheet sheet = sheetService.getAccessibleSheet(currentUser.getUserId(request), sheetId);
    return ResponseEntity.ok(aiSuggestionService.suggestNext(sheet));
  }

  @PostMapping("/{sheetId}/remix")
  public ResponseEntity<Sheet> remixSheet(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody(required = false) Map<String, String> body) {
    String title = body == null ? null : body.get("title");
    return ResponseEntity.ok(sheetService.remixSheet(currentUser.getUserId(request), sheetId, title));
  }

  @PostMapping("/{sheetId}/copy")
  public ResponseEntity<Sheet> copyPublicSheet(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @RequestBody(required = false) Map<String, String> body) {
    String title = body == null ? null : body.get("title");
    return ResponseEntity.ok(sheetService.copyPublicSheet(currentUser.getUserId(request), sheetId, title));
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
  public ResponseEntity<SheetEngagementResponse> trackEngagement(
      HttpServletRequest request,
      @PathVariable String sheetId,
      @Valid @RequestBody SheetEngagementRequest body) {
    return ResponseEntity.ok(sheetService.trackEngagement(currentUser.getUserId(request), sheetId, body.getAction()));
  }

  private String bodyValue(Map<String, String> body, String key) {
    return body == null ? null : body.get(key);
  }
}
