package com.iqms.backend.repository;

import com.iqms.backend.model.TeamSheetProgress;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TeamSheetProgressRepository extends MongoRepository<TeamSheetProgress, String> {
  List<TeamSheetProgress> findAllByTeamId(String teamId);
  List<TeamSheetProgress> findAllByTeamIdAndUserId(String teamId, String userId);
}
