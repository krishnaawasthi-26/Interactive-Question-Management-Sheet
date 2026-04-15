package com.iqms.backend.repository;

import com.iqms.backend.model.Sheet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface SheetRepository extends MongoRepository<Sheet, String> {
  List<Sheet> findAllByOwnerIdOrderByUpdatedAtDesc(String ownerId);
  Optional<Sheet> findByIdAndOwnerId(String id, String ownerId);
  Optional<Sheet> findByShareId(String shareId);

  @Query("{ '$or': [ "
      + "{ 'ownerId': ?0 }, "
      + "{ 'collaborators.userId': ?0 }, "
      + "{ 'visibility': { '$in': ['public', 'unlisted'] } }, "
      + "{ 'isPublic': true } "
      + "] }")
  List<Sheet> findCandidateAccessibleSheets(String userId);

  @Query("{ '$or': [ "
      + "{ 'visibility': { '$in': ['public', 'unlisted'] } }, "
      + "{ 'isPublic': true } "
      + "] }")
  List<Sheet> findAllDiscoverableSheets();
}
