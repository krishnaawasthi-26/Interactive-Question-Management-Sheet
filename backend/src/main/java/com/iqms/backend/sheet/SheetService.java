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

  public SheetService(
      SheetRepository sheetRepository,
      UserRepository userRepository,
      ActionQueueService actionQueueService) {
    this.sheetRepository = sheetRepository;
    this.userRepository = userRepository;
    this.actionQueueService = actionQueueService;
  }

  public Sheet createSheet(String ownerId, String title) {
    return actionQueueService.execute(() -> {
      Sheet sheet = new Sheet();
      sheet.setOwnerId(ownerId);
      sheet.setTitle(title == null || title.isBlank() ? "Untitled Sheet" : title.trim());
      sheet.setShareId("sheet_" + UUID.randomUUID().toString().replace("-", ""));
      sheet.setPublic(false);
      sheet.setArchived(false);
      sheet.setCreatedAt(Instant.now());
      sheet.setUpdatedAt(Instant.now());
      return sheetRepository.save(sheet);
    });
  }

  public List<Sheet> listSheetsForOwner(String ownerId) {
    return sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc(ownerId);
  }

  public Sheet getOwnedSheet(String ownerId, String sheetId) {
    return sheetRepository
        .findByIdAndOwnerId(sheetId, ownerId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));
  }

  public Sheet updateOwnedSheet(
      String ownerId,
      String sheetId,
      String title,
      List<Map<String, Object>> topics,
      Boolean isPublic,
      Boolean isArchived) {
    return actionQueueService.execute(() -> {
      Sheet sheet = getOwnedSheet(ownerId, sheetId);
      if (title != null && !title.isBlank()) {
        sheet.setTitle(title.trim());
      }
      if (topics != null) {
        sheet.setTopics(topics);
      }
      if (isPublic != null) {
        sheet.setPublic(isPublic);
      }
      if (isArchived != null) {
        sheet.setArchived(isArchived);
      }
      sheet.setUpdatedAt(Instant.now());
      return sheetRepository.save(sheet);
    });
  }

  public void deleteOwnedSheet(String ownerId, String sheetId) {
    actionQueueService.execute(() -> {
      Sheet sheet = getOwnedSheet(ownerId, sheetId);
      sheetRepository.delete(sheet);
      return null;
    });
  }

  public Sheet getByShareId(String shareId) {
    return sheetRepository
        .findByShareId(shareId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
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
