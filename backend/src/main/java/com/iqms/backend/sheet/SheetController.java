package com.iqms.backend.controller;

import com.iqms.backend.dto.sheet.SheetCreateRequest;
import com.iqms.backend.dto.sheet.SheetEngagementRequest;
import com.iqms.backend.dto.sheet.SheetEngagementResponse;
import com.iqms.backend.dto.sheet.SheetUpdateRequest;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.SheetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
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

  public SheetController(SheetService sheetService, CurrentUser currentUser) {
    this.sheetService = sheetService;
    this.currentUser = currentUser;
  }

  @GetMapping
  public ResponseEntity<List<Sheet>> listSheets(HttpServletRequest request) {
    return ResponseEntity.ok(sheetService.listSheetsForOwner(currentUser.getUserId(request)));
  }

  @PostMapping
  public ResponseEntity<Sheet> createSheet(HttpServletRequest request, @Valid @RequestBody SheetCreateRequest body) {
    return ResponseEntity.ok(sheetService.createSheet(currentUser.getUserId(request), body.getTitle()));
  }

  @GetMapping("/{sheetId}")
  public ResponseEntity<Sheet> getSheet(HttpServletRequest request, @PathVariable String sheetId) {
    return ResponseEntity.ok(sheetService.getOwnedSheet(currentUser.getUserId(request), sheetId));
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
}
