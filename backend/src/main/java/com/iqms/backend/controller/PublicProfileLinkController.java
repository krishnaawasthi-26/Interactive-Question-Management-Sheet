package com.iqms.backend.controller;

import com.iqms.backend.profile.ProfileShareService;
import com.iqms.backend.sheet.Sheet;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class PublicProfileLinkController {

  private final ProfileShareService profileShareService;

  public PublicProfileLinkController(ProfileShareService profileShareService) {
    this.profileShareService = profileShareService;
  }

  @GetMapping("/{username}")
  public ResponseEntity<Map<String, Object>> getPublicProfileLink(@PathVariable String username) {
    return ResponseEntity.ok(profileShareService.getPublicProfile(username));
  }

  @GetMapping("/{username}/{sheetSlug}")
  public ResponseEntity<Sheet> getPublicSheetLink(
      @PathVariable String username,
      @PathVariable String sheetSlug) {
    return ResponseEntity.ok(profileShareService.getPublicSheet(username, sheetSlug));
  }
}
