package com.iqms.backend.controller;

import com.iqms.backend.model.StudyTeam;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.StudyTeamService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class StudyTeamController {
  private final StudyTeamService teamService;
  private final CurrentUser currentUser;

  public StudyTeamController(StudyTeamService teamService, CurrentUser currentUser) {
    this.teamService = teamService;
    this.currentUser = currentUser;
  }

  @GetMapping
  public ResponseEntity<List<StudyTeam>> list(HttpServletRequest request) {
    return ResponseEntity.ok(teamService.listForUser(currentUser.getUserId(request)));
  }

  @PostMapping
  public ResponseEntity<StudyTeam> create(HttpServletRequest request, @RequestBody(required = false) Map<String, String> body) {
    return ResponseEntity.ok(teamService.create(currentUser.getUserId(request), bodyValue(body, "name"), bodyValue(body, "mode")));
  }

  @PostMapping("/{teamId}/invite")
  public ResponseEntity<StudyTeam> invite(
      HttpServletRequest request,
      @PathVariable String teamId,
      @RequestBody(required = false) Map<String, String> body) {
    return ResponseEntity.ok(teamService.invite(currentUser.getUserId(request), teamId, bodyValue(body, "username"), bodyValue(body, "role")));
  }

  @PostMapping("/{teamId}/assign-sheet/{sheetId}")
  public ResponseEntity<StudyTeam> assign(
      HttpServletRequest request,
      @PathVariable String teamId,
      @PathVariable String sheetId) {
    return ResponseEntity.ok(teamService.assignSheet(currentUser.getUserId(request), teamId, sheetId));
  }

  @GetMapping("/{teamId}/dashboard/admin")
  public ResponseEntity<Map<String, Object>> adminDashboard(HttpServletRequest request, @PathVariable String teamId) {
    return ResponseEntity.ok(teamService.adminDashboard(currentUser.getUserId(request), teamId));
  }

  @GetMapping("/{teamId}/dashboard/member")
  public ResponseEntity<Map<String, Object>> memberDashboard(HttpServletRequest request, @PathVariable String teamId) {
    return ResponseEntity.ok(teamService.memberDashboard(currentUser.getUserId(request), teamId));
  }

  private String bodyValue(Map<String, String> body, String key) {
    return body == null ? null : body.get(key);
  }
}
