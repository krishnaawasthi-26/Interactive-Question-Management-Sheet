package com.iqms.backend.controller;

import com.iqms.backend.profile.ProfileShareService;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.service.SheetService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/shared")
public class ShareLinkController {

  private final SheetService sheetService;
  private final ProfileShareService profileShareService;

  public ShareLinkController(SheetService sheetService, ProfileShareService profileShareService) {
    this.sheetService = sheetService;
    this.profileShareService = profileShareService;
  }

  @GetMapping("/sheet/{shareId}")
  public ResponseEntity<Sheet> getSharedSheetByLink(@PathVariable String shareId) {
    return ResponseEntity.ok(sheetService.getByShareId(shareId));
  }

  @GetMapping("/profile/{profileShareId}")
  public ResponseEntity<Map<String, Object>> getSharedProfileByLink(@PathVariable String profileShareId) {
    return ResponseEntity.ok(profileShareService.getSharedProfile(profileShareId));
  }
}
