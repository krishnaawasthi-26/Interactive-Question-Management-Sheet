package com.iqms.backend.repository;

import com.iqms.backend.model.RevisionNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RevisionNotificationRepository extends MongoRepository<RevisionNotification, String> {
  List<RevisionNotification> findAllByUserIdOrderByDueAtAsc(String userId);
  long countByUserIdAndStatusIn(String userId, List<String> statuses);
  Optional<RevisionNotification> findByIdAndUserId(String id, String userId);
  Optional<RevisionNotification> findByUserIdAndSheetIdAndProblemIdAndRevisionNumber(
      String userId,
      String sheetId,
      String problemId,
      int revisionNumber);
}
