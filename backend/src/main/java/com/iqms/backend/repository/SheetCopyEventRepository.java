package com.iqms.backend.repository;

import com.iqms.backend.model.SheetCopyEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SheetCopyEventRepository extends MongoRepository<SheetCopyEvent, String> {
  Optional<SheetCopyEvent> findBySourceSheetIdAndCopiedByUserId(String sourceSheetId, String copiedByUserId);
  List<SheetCopyEvent> findBySourceOwnerIdOrderByCopiedAtDesc(String sourceOwnerId);
}
