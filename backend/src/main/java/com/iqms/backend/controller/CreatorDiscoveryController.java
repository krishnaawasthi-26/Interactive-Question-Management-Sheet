package com.iqms.backend.controller;

import com.iqms.backend.service.CreatorDiscoveryService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discovery")
public class CreatorDiscoveryController {
  private final CreatorDiscoveryService creatorDiscoveryService;

  public CreatorDiscoveryController(CreatorDiscoveryService creatorDiscoveryService) {
    this.creatorDiscoveryService = creatorDiscoveryService;
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> discovery() {
    return ResponseEntity.ok(creatorDiscoveryService.discovery());
  }
}
