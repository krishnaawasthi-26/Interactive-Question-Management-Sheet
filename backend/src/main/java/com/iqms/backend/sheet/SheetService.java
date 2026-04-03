package com.iqms.backend.sheet;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SheetService {

  private final SheetRepository sheetRepository;

  public SheetService(SheetRepository sheetRepository) {
    this.sheetRepository = sheetRepository;
  }

  public Sheet createSheet(String ownerId, String title) {
    Sheet sheet = new Sheet();
    sheet.setOwnerId(ownerId);
    sheet.setTitle(title == null || title.isBlank() ? "Untitled Sheet" : title.trim());
    sheet.setShareId("sheet_" + UUID.randomUUID().toString().replace("-", ""));
    sheet.setCreatedAt(Instant.now());
    sheet.setUpdatedAt(Instant.now());
    return sheetRepository.save(sheet);
  }

  public List<Sheet> listSheetsForOwner(String ownerId) {
    return sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc(ownerId);
  }

  public Sheet getOwnedSheet(String ownerId, String sheetId) {
    return sheetRepository
        .findByIdAndOwnerId(sheetId, ownerId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));
  }

  public Sheet updateOwnedSheet(String ownerId, String sheetId, String title, List<Map<String, Object>> topics) {
    Sheet sheet = getOwnedSheet(ownerId, sheetId);
    if (title != null && !title.isBlank()) {
      sheet.setTitle(title.trim());
    }
    if (topics != null) {
      sheet.setTopics(topics);
    }
    sheet.setUpdatedAt(Instant.now());
    return sheetRepository.save(sheet);
  }

  public void deleteOwnedSheet(String ownerId, String sheetId) {
    Sheet sheet = getOwnedSheet(ownerId, sheetId);
    sheetRepository.delete(sheet);
  }

  public Sheet getByShareId(String shareId) {
    return sheetRepository
        .findByShareId(shareId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
  }
}
