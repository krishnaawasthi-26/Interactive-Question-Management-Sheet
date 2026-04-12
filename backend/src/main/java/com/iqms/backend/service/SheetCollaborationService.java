package com.iqms.backend.service;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.SheetActivityEvent;
import com.iqms.backend.model.SheetComment;
import com.iqms.backend.repository.SheetActivityEventRepository;
import com.iqms.backend.repository.SheetCommentRepository;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SheetCollaborationService {
  private final SheetRepository sheetRepository;
  private final UserRepository userRepository;
  private final SheetCommentRepository commentRepository;
  private final SheetActivityEventRepository activityEventRepository;

  public SheetCollaborationService(
      SheetRepository sheetRepository,
      UserRepository userRepository,
      SheetCommentRepository commentRepository,
      SheetActivityEventRepository activityEventRepository) {
    this.sheetRepository = sheetRepository;
    this.userRepository = userRepository;
    this.commentRepository = commentRepository;
    this.activityEventRepository = activityEventRepository;
  }

  public Sheet invite(String actorUserId, String sheetId, String username, String role) {
    Sheet sheet = findSheet(sheetId);
    requireOwner(sheet, actorUserId);

    String normalizedRole = normalizeRole(role);
    if ("owner".equals(normalizedRole)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot invite as owner.");
    }

    String userId = userRepository.findByUsername(username.toLowerCase(Locale.ROOT))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."))
        .getId();

    boolean updated = false;
    for (Sheet.Collaborator collaborator : sheet.getCollaborators()) {
      if (userId.equals(collaborator.getUserId())) {
        collaborator.setRole(normalizedRole);
        updated = true;
      }
    }
    if (!updated) {
      Sheet.Collaborator collaborator = new Sheet.Collaborator();
      collaborator.setUserId(userId);
      collaborator.setRole(normalizedRole);
      collaborator.setInvitedAt(Instant.now());
      sheet.getCollaborators().add(collaborator);
    }

    sheet.setUpdatedAt(Instant.now());
    Sheet saved = sheetRepository.save(sheet);
    track(sheetId, actorUserId, "invite_sent", Map.of("targetUserId", userId, "role", normalizedRole));
    return saved;
  }

  public boolean canEdit(Sheet sheet, String userId) {
    if (sheet.getOwnerId().equals(userId)) return true;
    return sheet.getCollaborators().stream()
        .anyMatch(c -> userId.equals(c.getUserId()) && "editor".equals(normalizeRole(c.getRole())));
  }

  public boolean canView(Sheet sheet, String userId) {
    if (sheet.getOwnerId().equals(userId) || canEdit(sheet, userId)) return true;
    boolean isViewer = sheet.getCollaborators().stream()
        .anyMatch(c -> userId.equals(c.getUserId()) && "viewer".equals(normalizeRole(c.getRole())));
    if (isViewer) return true;
    return "public".equals(sheet.getVisibility()) || "unlisted".equals(sheet.getVisibility());
  }

  public SheetComment addComment(String actorUserId, String sheetId, String content, String topicId, String subTopicId, String questionId) {
    Sheet sheet = findSheet(sheetId);
    if (!canView(sheet, actorUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to comment on this sheet.");
    }
    if (!sheet.isCommentsEnabled()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comments are disabled for this sheet.");
    }

    SheetComment comment = new SheetComment();
    comment.setSheetId(sheetId);
    comment.setAuthorUserId(actorUserId);
    comment.setContent(content == null ? "" : content.trim());
    comment.setTopicId(topicId);
    comment.setSubTopicId(subTopicId);
    comment.setQuestionId(questionId);
    comment.setCreatedAt(Instant.now());

    SheetComment saved = commentRepository.save(comment);
    track(sheetId, actorUserId, "comment_added", Map.of("commentId", saved.getId()));
    return saved;
  }

  public List<SheetComment> comments(String actorUserId, String sheetId) {
    Sheet sheet = findSheet(sheetId);
    if (!canView(sheet, actorUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view comments.");
    }
    return commentRepository.findTop100BySheetIdOrderByCreatedAtDesc(sheetId);
  }

  public List<SheetActivityEvent> activity(String actorUserId, String sheetId) {
    Sheet sheet = findSheet(sheetId);
    if (!canView(sheet, actorUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view activity.");
    }
    return activityEventRepository.findTop100BySheetIdOrderByCreatedAtDesc(sheetId);
  }

  public void track(String sheetId, String actorUserId, String eventType, Map<String, Object> metadata) {
    SheetActivityEvent event = new SheetActivityEvent();
    event.setSheetId(sheetId);
    event.setActorUserId(actorUserId);
    event.setEventType(eventType);
    event.setMetadata(metadata == null ? new LinkedHashMap<>() : new LinkedHashMap<>(metadata));
    event.setCreatedAt(Instant.now());
    activityEventRepository.save(event);
  }

  public Sheet findSheet(String sheetId) {
    return sheetRepository.findById(sheetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));
  }

  public void requireOwner(Sheet sheet, String actorUserId) {
    if (!sheet.getOwnerId().equals(actorUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can manage access.");
    }
  }

  public String normalizeRole(String role) {
    String normalized = (role == null ? "viewer" : role.trim().toLowerCase(Locale.ROOT));
    return switch (normalized) {
      case "owner", "editor", "viewer" -> normalized;
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid collaborator role.");
    };
  }
}
