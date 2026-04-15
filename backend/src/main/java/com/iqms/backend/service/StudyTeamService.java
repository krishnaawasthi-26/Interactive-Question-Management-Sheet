package com.iqms.backend.service;

import com.iqms.backend.model.StudyTeam;
import com.iqms.backend.model.TeamSheetProgress;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.StudyTeamRepository;
import com.iqms.backend.repository.TeamSheetProgressRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudyTeamService {
  private final StudyTeamRepository teamRepository;
  private final TeamSheetProgressRepository progressRepository;
  private final UserRepository userRepository;
  private final EntitlementService entitlementService;
  private final PremiumAccessService premiumAccessService;

  public StudyTeamService(
      StudyTeamRepository teamRepository,
      TeamSheetProgressRepository progressRepository,
      UserRepository userRepository,
      EntitlementService entitlementService,
      PremiumAccessService premiumAccessService) {
    this.teamRepository = teamRepository;
    this.progressRepository = progressRepository;
    this.userRepository = userRepository;
    this.entitlementService = entitlementService;
    this.premiumAccessService = premiumAccessService;
  }

  public StudyTeam create(String ownerUserId, String name, String mode) {
    User owner = premiumAccessService.findUser(ownerUserId);
    StudyTeam team = new StudyTeam();
    team.setOwnerUserId(ownerUserId);
    team.setName(name == null || name.isBlank() ? "Untitled Classroom" : name.trim());
    team.setMode((mode == null || mode.isBlank()) ? "classroom" : mode.trim().toLowerCase(Locale.ROOT));
    team.setCreatedAt(Instant.now());
    team.setUpdatedAt(Instant.now());

    StudyTeam.Membership ownerMembership = new StudyTeam.Membership();
    ownerMembership.setUserId(ownerUserId);
    ownerMembership.setRole("admin");
    ownerMembership.setJoinedAt(Instant.now());
    team.getMemberships().add(ownerMembership);

    return teamRepository.save(team);
  }

  public List<StudyTeam> listForUser(String userId) {
    return teamRepository.findAll().stream()
        .filter(team -> team.getMemberships().stream().anyMatch(member -> userId.equals(member.getUserId())))
        .toList();
  }

  public StudyTeam invite(String actorUserId, String teamId, String username, String role) {
    StudyTeam team = find(teamId);
    requireMentorOrAdmin(team, actorUserId);
    if (username == null || username.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required.");
    }

    User actor = premiumAccessService.findUser(actorUserId);
    if (team.getMemberships().size() >= 10) {
      entitlementService.requireFeature(actor, "team_unlimited_members");
    }

    User target = userRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

    String normalizedRole = normalizeRole(role);
    boolean updated = false;
    for (StudyTeam.Membership membership : team.getMemberships()) {
      if (target.getId().equals(membership.getUserId())) {
        membership.setRole(normalizedRole);
        updated = true;
      }
    }
    if (!updated) {
      StudyTeam.Membership membership = new StudyTeam.Membership();
      membership.setUserId(target.getId());
      membership.setRole(normalizedRole);
      membership.setJoinedAt(Instant.now());
      team.getMemberships().add(membership);
    }

    team.setUpdatedAt(Instant.now());
    return teamRepository.save(team);
  }

  public StudyTeam assignSheet(String actorUserId, String teamId, String sheetId) {
    StudyTeam team = find(teamId);
    requireMentorOrAdmin(team, actorUserId);
    if (!team.getAssignedSheetIds().contains(sheetId)) {
      team.getAssignedSheetIds().add(sheetId);
      team.setUpdatedAt(Instant.now());
    }
    return teamRepository.save(team);
  }

  public Map<String, Object> adminDashboard(String actorUserId, String teamId) {
    StudyTeam team = find(teamId);
    requireMentorOrAdmin(team, actorUserId);
    List<TeamSheetProgress> progressEntries = progressRepository.findAllByTeamId(teamId);

    int totalMembers = team.getMemberships().size();
    int activeMembers = (int) progressEntries.stream().map(TeamSheetProgress::getUserId).distinct().count();
    double avgProgress = progressEntries.stream().mapToInt(entry -> entry.getProgressPercent() == null ? 0 : entry.getProgressPercent()).average().orElse(0);
    int overdueRevisionItems = progressEntries.stream().mapToInt(entry -> entry.getOverdueRevisionCount() == null ? 0 : entry.getOverdueRevisionCount()).sum();

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("team", team);
    payload.put("totalMembers", totalMembers);
    payload.put("activeMembers", activeMembers);
    payload.put("averageProgress", Math.round(avgProgress));
    payload.put("overdueRevisionItems", overdueRevisionItems);
    payload.put("topPerformers", progressEntries.stream()
        .sorted(Comparator.comparingInt(this::safeProgressPercent).reversed())
        .limit(5)
        .toList());
    payload.put("lowEngagement", progressEntries.stream()
        .sorted(Comparator.comparingInt(this::safeProgressPercent))
        .limit(5)
        .toList());
    return payload;
  }

  public Map<String, Object> memberDashboard(String actorUserId, String teamId) {
    StudyTeam team = find(teamId);
    requireMembership(team, actorUserId);
    List<TeamSheetProgress> progress = progressRepository.findAllByTeamIdAndUserId(teamId, actorUserId);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("team", team);
    payload.put("assignedSheets", team.getAssignedSheetIds());
    payload.put("dueToday", progress.stream().mapToInt(entry -> entry.getDueCount() == null ? 0 : entry.getDueCount()).sum());
    payload.put("progressSummary", progress);
    payload.put("recentActivity", progress.stream()
        .sorted(Comparator.comparing(TeamSheetProgress::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .limit(10)
        .toList());
    return payload;
  }

  private int safeProgressPercent(TeamSheetProgress entry) {
    return entry.getProgressPercent() == null ? 0 : entry.getProgressPercent();
  }

  private StudyTeam find(String teamId) {
    return teamRepository.findById(teamId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));
  }

  private void requireMentorOrAdmin(StudyTeam team, String actorUserId) {
    boolean allowed = team.getMemberships().stream().anyMatch(member ->
        actorUserId.equals(member.getUserId()) && ("admin".equals(member.getRole()) || "mentor".equals(member.getRole())));
    if (!allowed) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin or mentor role required.");
    }
  }

  private void requireMembership(StudyTeam team, String actorUserId) {
    boolean allowed = team.getMemberships().stream().anyMatch(member -> actorUserId.equals(member.getUserId()));
    if (!allowed) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Team membership required.");
    }
  }

  private String normalizeRole(String role) {
    String normalized = role == null ? "student" : role.trim().toLowerCase(Locale.ROOT);
    return switch (normalized) {
      case "admin", "mentor", "student" -> normalized;
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported team role.");
    };
  }
}
