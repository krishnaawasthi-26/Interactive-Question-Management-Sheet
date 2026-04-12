package com.iqms.backend.service;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
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
    List<Sheet> publicSheets = sheetRepository.findAll().stream()
        .filter(sheet -> sheet.isPublic() || "public".equals(sheet.getVisibility()))
        .toList();

    List<Map<String, Object>> trendingCreators = users.stream()
        .sorted((a, b) -> Integer.compare(
            b.getFollowerUserIds() == null ? 0 : b.getFollowerUserIds().size(),
            a.getFollowerUserIds() == null ? 0 : a.getFollowerUserIds().size()))
        .limit(20)
        .map(user -> {
          Map<String, Object> row = new LinkedHashMap<>();
          row.put("username", user.getUsername());
          row.put("name", user.getName() == null ? user.getUsername() : user.getName());
          row.put("bio", user.getBio() == null ? "" : user.getBio());
          row.put("followersCount", user.getFollowerUserIds() == null ? 0 : user.getFollowerUserIds().size());
          return row;
        })
        .toList();

    List<Map<String, Object>> trendingSheets = publicSheets.stream()
        .sorted((a, b) -> Integer.compare(
            (b.getCopiedByUsernames() == null ? 0 : b.getCopiedByUsernames().size()) + (b.getDownloadedByUsernames() == null ? 0 : b.getDownloadedByUsernames().size()),
            (a.getCopiedByUsernames() == null ? 0 : a.getCopiedByUsernames().size()) + (a.getDownloadedByUsernames() == null ? 0 : a.getDownloadedByUsernames().size())))
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
    payload.put("recentlyPublished", trendingSheets.stream().sorted((a, b) -> String.valueOf(b.get("updatedAt")).compareTo(String.valueOf(a.get("updatedAt")))).limit(20).toList());
    return payload;
  }
}
