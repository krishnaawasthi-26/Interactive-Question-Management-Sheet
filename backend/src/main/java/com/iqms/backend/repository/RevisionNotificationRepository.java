package com.iqms.backend.repository;

import com.iqms.backend.model.RevisionNotification;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface RevisionNotificationRepository extends MongoRepository<RevisionNotification, String> {
  @Query("{ 'userId': ?0, '$or': [ { 'expiresAt': null }, { 'expiresAt': { '$gt': ?1 } } ] }")
  List<RevisionNotification> findVisibleByUserId(String userId, Instant now, Pageable pageable);

  @Query("{ 'userId': ?0, 'type': ?1, '$or': [ { 'expiresAt': null }, { 'expiresAt': { '$gt': ?2 } } ] }")
  List<RevisionNotification> findVisibleByUserIdAndType(String userId, String type, Instant now, Pageable pageable);

  @Query(value = "{ 'userId': ?0, 'status': ?1, '$or': [ { 'expiresAt': null }, { 'expiresAt': { '$gt': ?2 } } ] }", count = true)
  long countVisibleByUserIdAndStatus(String userId, String status, Instant now);

  Optional<RevisionNotification> findByIdAndUserId(String id, String userId);

  @Query("{ 'userId': ?0, 'type': ?1, 'sourceType': ?2, 'sourceId': ?3, 'metadata.revisionNumber': ?4 }")
  Optional<RevisionNotification> findRevisionBySource(String userId, String type, String sourceType, String sourceId, int revisionNumber);

  List<RevisionNotification> findAllByUserIdAndTypeAndStatusAndScheduledForBefore(String userId, String type, String status, Instant before);

  List<RevisionNotification> findAllByUserIdAndTypeAndStatusAndScheduledForAfterOrderByScheduledForAsc(
      String userId,
      String type,
      String status,
      Instant after,
      Pageable pageable);
}
