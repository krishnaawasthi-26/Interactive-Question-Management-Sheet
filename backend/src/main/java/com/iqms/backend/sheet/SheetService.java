package com.iqms.backend.service;

import com.iqms.backend.dto.sheet.SheetEngagementResponse;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.queue.ActionQueueService;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SheetService {

  private final SheetRepository sheetRepository;
  private final UserRepository userRepository;
  private final ActionQueueService actionQueueService;
  private final PremiumAccessService premiumAccessService;
  private final SheetCollaborationService collaborationService;

  public SheetService(
      SheetRepository sheetRepository,
      UserRepository userRepository,
      ActionQueueService actionQueueService,
      PremiumAccessService premiumAccessService,
      SheetCollaborationService collaborationService) {
    this.sheetRepository = sheetRepository;
    this.userRepository = userRepository;
    this.actionQueueService = actionQueueService;
    this.premiumAccessService = premiumAccessService;
    this.collaborationService = collaborationService;
  }

  public Sheet createSheet(String ownerId, String title) {
    return actionQueueService.execute(() -> {
      Sheet sheet = new Sheet();
      sheet.setOwnerId(ownerId);
      sheet.setTitle(title == null || title.isBlank() ? "Untitled Sheet" : title.trim());
      sheet.setShareId("sheet_" + UUID.randomUUID().toString().replace("-", ""));
      sheet.setPublic(false);
      sheet.setVisibility("private");
      sheet.setArchived(false);
      sheet.setCommentsEnabled(true);
      sheet.setCreatedAt(Instant.now());
      sheet.setUpdatedAt(Instant.now());
      return sheetRepository.save(sheet);
    });
  }

  public List<Sheet> listSheetsForOwner(String ownerId) {
    return sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc(ownerId);
  }

  public List<Sheet> listSheetsAccessibleBy(String userId) {
    return sheetRepository.findAll().stream()
        .filter(sheet -> collaborationService.canView(sheet, userId))
        .toList();
  }

  public Sheet getOwnedSheet(String ownerId, String sheetId) {
    return sheetRepository
        .findByIdAndOwnerId(sheetId, ownerId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));
  }

  public Sheet getAccessibleSheet(String userId, String sheetId) {
    Sheet sheet = sheetRepository.findById(sheetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));
    if (!collaborationService.canView(sheet, userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to sheet.");
    }
    return sheet;
  }

  public Sheet updateOwnedSheet(
      String actorUserId,
      String sheetId,
      String title,
      List<Map<String, Object>> topics,
      Boolean isPublic,
      Boolean isArchived) {
    return actionQueueService.execute(() -> {
      Sheet sheet = getAccessibleSheet(actorUserId, sheetId);
      if (!collaborationService.canEdit(sheet, actorUserId) && !sheet.getOwnerId().equals(actorUserId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No edit permission for sheet.");
      }

      if (title != null && !title.isBlank()) {
        sheet.setTitle(title.trim());
      }
      if (topics != null) {
        User user = premiumAccessService.findUser(sheet.getOwnerId());
        premiumAccessService.assertFreeLimits(user, topics);
        sheet.setTopics(topics);
      }
      if (isPublic != null) {
        collaborationService.requireOwner(sheet, actorUserId);
        sheet.setPublic(isPublic);
        sheet.setVisibility(isPublic ? "public" : "private");
      }
      if (isArchived != null) {
        collaborationService.requireOwner(sheet, actorUserId);
        sheet.setArchived(isArchived);
      }
      sheet.setUpdatedAt(Instant.now());
      Sheet saved = sheetRepository.save(sheet);
      collaborationService.track(sheetId, actorUserId, "sheet_updated", Map.of("title", saved.getTitle()));
      return saved;
    });
  }

  public Sheet updateSharingSettings(String actorUserId, String sheetId, String visibility, Boolean commentsEnabled) {
    return actionQueueService.execute(() -> {
      Sheet sheet = getAccessibleSheet(actorUserId, sheetId);
      collaborationService.requireOwner(sheet, actorUserId);
      if (visibility != null && !visibility.isBlank()) {
        String normalized = visibility.trim().toLowerCase();
        if (!List.of("private", "public", "unlisted", "team").contains(normalized)) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility option.");
        }
        sheet.setVisibility(normalized);
        sheet.setPublic("public".equals(normalized));
      }
      if (commentsEnabled != null) {
        sheet.setCommentsEnabled(commentsEnabled);
      }
      sheet.setUpdatedAt(Instant.now());
      Sheet saved = sheetRepository.save(sheet);
      collaborationService.track(sheetId, actorUserId, "sharing_updated", Map.of("visibility", saved.getVisibility()));
      return saved;
    });
  }

  public void deleteOwnedSheet(String ownerId, String sheetId) {
    actionQueueService.execute(() -> {
      Sheet sheet = getOwnedSheet(ownerId, sheetId);
      sheetRepository.delete(sheet);
      collaborationService.track(sheetId, ownerId, "sheet_deleted", Map.of());
      return null;
    });
  }

  public Sheet getByShareId(String shareId) {
    return sheetRepository
        .findByShareId(shareId)
        .filter(sheet -> "public".equals(sheet.getVisibility()) || "unlisted".equals(sheet.getVisibility()) || sheet.isPublic())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
  }

  public Sheet remixSheet(String actorUserId, String sourceSheetId, String title) {
    Sheet source = sheetRepository.findById(sourceSheetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source sheet not found."));
    if (!("public".equals(source.getVisibility()) || "unlisted".equals(source.getVisibility()) || source.isPublic())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sheet is not remixable.");
    }
    Sheet remixed = createSheet(actorUserId, title == null ? source.getTitle() + " (Remix)" : title);
    remixed.setTopics(source.getTopics());
    remixed.setParentSheetId(source.getId());
    remixed.setRemixSourceOwnerId(source.getOwnerId());
    remixed.setUpdatedAt(Instant.now());
    Sheet saved = sheetRepository.save(remixed);
    collaborationService.track(sourceSheetId, actorUserId, "sheet_remixed", Map.of("newSheetId", saved.getId()));
    return saved;
  }

  public SheetEngagementResponse trackEngagement(String actorUserId, String sheetId, String action) {
    User user = userRepository.findById(actorUserId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

    String normalizedAction = action == null ? "" : action.trim().toLowerCase();
    Sheet sheet;
    if ("download".equals(normalizedAction)) {
      sheet = recordDownload(sheetId, user.getUsername());
    } else if ("copy".equals(normalizedAction)) {
      sheet = recordCopy(sheetId, user.getUsername());
      if (user.getCopiedSheetIds().add(sheetId)) {
        userRepository.save(user);
      }
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown action.");
    }

    int downloadCount = sheet.getDownloadedByUsernames() == null ? 0 : sheet.getDownloadedByUsernames().size();
    int copyCount = sheet.getCopiedByUsernames() == null ? 0 : sheet.getCopiedByUsernames().size();
    return new SheetEngagementResponse(sheet.getId(), downloadCount, copyCount);
  }

  public Sheet recordDownload(String sheetId, String username) {
    return actionQueueService.execute(() -> {
      Sheet sheet = sheetRepository
          .findById(sheetId)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));

      List<String> downloadedBy = sheet.getDownloadedByUsernames() == null
          ? new ArrayList<>()
          : new ArrayList<>(sheet.getDownloadedByUsernames());
      if (!downloadedBy.contains(username)) {
        downloadedBy.add(username);
        sheet.setDownloadedByUsernames(downloadedBy);
        sheet.setUpdatedAt(Instant.now());
        return sheetRepository.save(sheet);
      }
      return sheet;
    });
  }

  public Sheet recordCopy(String sheetId, String username) {
    return actionQueueService.execute(() -> {
      Sheet sheet = sheetRepository
          .findById(sheetId)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));

      List<String> copiedBy = sheet.getCopiedByUsernames() == null
          ? new ArrayList<>()
          : new ArrayList<>(sheet.getCopiedByUsernames());
      if (!copiedBy.contains(username)) {
        copiedBy.add(username);
        sheet.setCopiedByUsernames(copiedBy);
        sheet.setUpdatedAt(Instant.now());
        return sheetRepository.save(sheet);
      }
      return sheet;
    });
  }
}
