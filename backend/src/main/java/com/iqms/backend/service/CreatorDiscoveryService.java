package com.iqms.backend.service;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CreatorDiscoveryService {
  private final UserRepository userRepository;
  private final SheetRepository sheetRepository;

  public CreatorDiscoveryService(UserRepository userRepository, SheetRepository sheetRepository) {
    this.userRepository = userRepository;
    this.sheetRepository = sheetRepository;
  }

  public Map<String, Object> discovery() {
    List<User> users = userRepository.findAll();
    List<Sheet> publicSheets = sheetRepository.findAllDiscoverableSheets();

    List<Map<String, Object>> trendingCreators = users.stream()
        .sorted(Comparator.comparingInt(this::followersCount).reversed())
        .limit(20)
        .map(user -> {
          Map<String, Object> row = new LinkedHashMap<>();
          row.put("username", user.getUsername());
          row.put("name", user.getName() == null ? user.getUsername() : user.getName());
          row.put("bio", user.getBio() == null ? "" : user.getBio());
          row.put("followersCount", followersCount(user));
          return row;
        })
        .toList();

    List<Map<String, Object>> trendingSheets = publicSheets.stream()
        .sorted(Comparator.comparingInt(this::sheetEngagement).reversed())
        .limit(30)
        .map(sheet -> {
          Map<String, Object> row = new LinkedHashMap<>();
          row.put("id", sheet.getId());
          row.put("title", sheet.getTitle());
          row.put("ownerId", sheet.getOwnerId());
          row.put("copies", sheet.getCopiedByUsernames() == null ? 0 : sheet.getCopiedByUsernames().size());
          row.put("views", sheet.getDownloadedByUsernames() == null ? 0 : sheet.getDownloadedByUsernames().size());
          row.put("updatedAt", sheet.getUpdatedAt());
          row.put("parentSheetId", sheet.getParentSheetId());
          return row;
        })
        .toList();

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("trendingCreators", trendingCreators);
    payload.put("trendingSheets", trendingSheets);
    payload.put("recentlyPublished", trendingSheets.stream()
        .sorted(Comparator.comparing(this::rowUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .limit(20)
        .toList());
    return payload;
  }

  private int followersCount(User user) {
    return user.getFollowerUserIds() == null ? 0 : user.getFollowerUserIds().size();
  }

  private int sheetEngagement(Sheet sheet) {
    int copies = sheet.getCopiedByUsernames() == null ? 0 : sheet.getCopiedByUsernames().size();
    int downloads = sheet.getDownloadedByUsernames() == null ? 0 : sheet.getDownloadedByUsernames().size();
    return copies + downloads;
  }

  private Instant rowUpdatedAt(Map<String, Object> row) {
    Object value = row.get("updatedAt");
    return value instanceof Instant instant ? instant : null;
  }
}
