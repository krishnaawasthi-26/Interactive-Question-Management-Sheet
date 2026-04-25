package com.iqms.backend.service;

import com.iqms.backend.dto.sheet.SheetEngagementResponse;
import com.iqms.backend.model.SheetCopyEvent;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.queue.ActionQueueService;
import com.iqms.backend.repository.SheetCopyEventRepository;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SheetService {
  private static final Set<String> PROGRESS_KEYS = Set.of(
      "done",
      "progress",
      "progressPercent",
      "attemptLog",
      "attemptLogs",
      "revisionCompleted",
      "revisionDone",
      "revised",
      "reminderCompleted",
      "completedAt",
      "completedOn",
      "lastAttemptAt",
      "streak",
      "history");

  private final SheetRepository sheetRepository;
  private final SheetCopyEventRepository sheetCopyEventRepository;
  private final UserRepository userRepository;
  private final ActionQueueService actionQueueService;
  private final PremiumAccessService premiumAccessService;
  private final SheetCollaborationService collaborationService;

  public SheetService(
      SheetRepository sheetRepository,
      SheetCopyEventRepository sheetCopyEventRepository,
      UserRepository userRepository,
      ActionQueueService actionQueueService,
      PremiumAccessService premiumAccessService,
      SheetCollaborationService collaborationService) {
    this.sheetRepository = sheetRepository;
    this.sheetCopyEventRepository = sheetCopyEventRepository;
    this.userRepository = userRepository;
    this.actionQueueService = actionQueueService;
    this.premiumAccessService = premiumAccessService;
    this.collaborationService = collaborationService;
  }

  public Sheet createSheet(String ownerId, String title) {
    return actionQueueService.execute(() -> {
      User owner = premiumAccessService.findUser(ownerId);
      long existingSheetCount = sheetRepository.countByOwnerId(ownerId);
      premiumAccessService.assertSheetLimit(owner, existingSheetCount);

      Sheet sheet = new Sheet();
      sheet.setOwnerId(ownerId);
      sheet.setTitle(title == null || title.isBlank() ? "Untitled Sheet" : title.trim());
      sheet.setShareId("sheet_" + UUID.randomUUID().toString().replace("-", ""));
      sheet.setPublic(false);
      sheet.setShareProgress(false);
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
    return sheetRepository.findCandidateAccessibleSheets(userId).stream()
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
      Boolean isArchived,
      Boolean shareProgress) {
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
      if (shareProgress != null) {
        collaborationService.requireOwner(sheet, actorUserId);
        sheet.setShareProgress(shareProgress);
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
        .filter(this::isDiscoverable)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
  }

  public Sheet remixSheet(String actorUserId, String sourceSheetId, String title) {
    Sheet source = sheetRepository.findById(sourceSheetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source sheet not found."));
    if (!isDiscoverable(source)) {
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

  public Sheet copyPublicSheet(String actorUserId, String sourceSheetId, String title) {
    Sheet source = sheetRepository.findById(sourceSheetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source sheet not found."));
    if (!isDiscoverable(source)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sheet is not public.");
    }

    SheetCopyEvent existingEvent = sheetCopyEventRepository
        .findBySourceSheetIdAndCopiedByUserId(sourceSheetId, actorUserId)
        .orElse(null);
    if (existingEvent != null && existingEvent.getCopiedSheetId() != null) {
      return sheetRepository.findById(existingEvent.getCopiedSheetId()).orElseGet(() -> createCopy(source, actorUserId, title));
    }

    return createCopy(source, actorUserId, title);
  }

  private Sheet createCopy(Sheet source, String actorUserId, String title) {
    String copyTitle = title == null || title.isBlank() ? source.getTitle() + " (Copy)" : title.trim();
    Sheet copied = createSheet(actorUserId, copyTitle);
    copied.setTopics(source.isShareProgress() ? markSharedProgressSeedData(source.getTopics()) : stripProgressData(source.getTopics()));
    copied.setParentSheetId(source.getId());
    copied.setRemixSourceOwnerId(source.getOwnerId());
    copied.setUpdatedAt(Instant.now());
    Sheet saved = sheetRepository.save(copied);

    User user = userRepository.findById(actorUserId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    if (user.getCopiedSheetIds().add(source.getId())) {
      userRepository.save(user);
    }
    recordCopy(source.getId(), user.getUsername());

    SheetCopyEvent event = new SheetCopyEvent();
    event.setSourceSheetId(source.getId());
    event.setSourceOwnerId(source.getOwnerId());
    event.setCopiedByUserId(actorUserId);
    event.setCopiedSheetId(saved.getId());
    event.setCopiedAt(Instant.now());
    try {
      sheetCopyEventRepository.save(event);
    } catch (DuplicateKeyException ignored) {
      // Idempotent duplicate copy attempts from retries/double-clicks.
    }

    collaborationService.track(source.getId(), actorUserId, "sheet_copied", Map.of("newSheetId", saved.getId()));
    return saved;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> stripProgressData(List<Map<String, Object>> topics) {
    return (List<Map<String, Object>>) sanitizeProgress(topics, PROGRESS_KEYS);
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> markSharedProgressSeedData(List<Map<String, Object>> topics) {
    return (List<Map<String, Object>>) addSharedProgressSeedFlag(topics);
  }

  @SuppressWarnings("unchecked")
  private Object sanitizeProgress(Object node, Set<String> progressKeys) {
    if (node instanceof List<?> list) {
      List<Object> sanitized = new ArrayList<>();
      for (Object item : list) {
        sanitized.add(sanitizeProgress(item, progressKeys));
      }
      return sanitized;
    }
    if (!(node instanceof Map<?, ?> map)) return node;

    Map<String, Object> sanitized = new java.util.LinkedHashMap<>();
    for (Map.Entry<?, ?> entry : map.entrySet()) {
      String key = String.valueOf(entry.getKey());
      if (progressKeys.contains(key)) continue;
      sanitized.put(key, (Object) sanitizeProgress(entry.getValue(), progressKeys));
    }
    return sanitized;
  }

  @SuppressWarnings("unchecked")
  private Object addSharedProgressSeedFlag(Object node) {
    if (node instanceof List<?> list) {
      List<Object> copied = new ArrayList<>();
      for (Object item : list) {
        copied.add(addSharedProgressSeedFlag(item));
      }
      return copied;
    }
    if (!(node instanceof Map<?, ?> map)) return node;

    Map<String, Object> copied = new java.util.LinkedHashMap<>();
    for (Map.Entry<?, ?> entry : map.entrySet()) {
      String key = String.valueOf(entry.getKey());
      Object value = addSharedProgressSeedFlag(entry.getValue());
      if ("attemptLog".equals(key) && value instanceof Map<?, ?> attemptMap) {
        Map<String, Object> flaggedAttempt = new java.util.LinkedHashMap<>((Map<String, Object>) attemptMap);
        flaggedAttempt.put("fromSharedProgress", true);
        copied.put(key, flaggedAttempt);
        continue;
      }
      if ("attemptLogs".equals(key) && value instanceof List<?> attempts) {
        List<Object> flaggedAttempts = new ArrayList<>();
        for (Object attempt : attempts) {
          if (attempt instanceof Map<?, ?> attemptMap) {
            Map<String, Object> flaggedAttempt = new java.util.LinkedHashMap<>((Map<String, Object>) attemptMap);
            flaggedAttempt.put("fromSharedProgress", true);
            flaggedAttempts.add(flaggedAttempt);
          } else {
            flaggedAttempts.add(attempt);
          }
        }
        copied.put(key, flaggedAttempts);
        continue;
      }
      copied.put(key, value);
    }
    return copied;
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
      LinkedHashSet<String> uniqueDownloaders = new LinkedHashSet<>(downloadedBy);
      if (uniqueDownloaders.add(username)) {
        downloadedBy = new ArrayList<>(uniqueDownloaders);
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
      LinkedHashSet<String> uniqueCopiers = new LinkedHashSet<>(copiedBy);
      if (uniqueCopiers.add(username)) {
        copiedBy = new ArrayList<>(uniqueCopiers);
        sheet.setCopiedByUsernames(copiedBy);
        sheet.setUpdatedAt(Instant.now());
        return sheetRepository.save(sheet);
      }
      return sheet;
    });
  }

  private boolean isDiscoverable(Sheet sheet) {
    return "public".equals(sheet.getVisibility()) || "unlisted".equals(sheet.getVisibility()) || sheet.isPublic();
  }
}
