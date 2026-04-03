package com.iqms.backend.sheet;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SheetRepository extends MongoRepository<Sheet, String> {
  List<Sheet> findAllByOwnerIdOrderByUpdatedAtDesc(String ownerId);

  Optional<Sheet> findByIdAndOwnerId(String id, String ownerId);

  Optional<Sheet> findByShareId(String shareId);
}
