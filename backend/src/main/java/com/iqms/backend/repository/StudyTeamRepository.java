package com.iqms.backend.repository;

import com.iqms.backend.model.StudyTeam;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudyTeamRepository extends MongoRepository<StudyTeam, String> {
  List<StudyTeam> findAllByOwnerUserIdOrderByUpdatedAtDesc(String ownerUserId);
}
