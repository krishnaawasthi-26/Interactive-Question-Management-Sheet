package com.iqms.backend.repository;

import com.iqms.backend.model.SheetActivityEvent;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SheetActivityEventRepository extends MongoRepository<SheetActivityEvent, String> {
  List<SheetActivityEvent> findTop100BySheetIdOrderByCreatedAtDesc(String sheetId);
}
