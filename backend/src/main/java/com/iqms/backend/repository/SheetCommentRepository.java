package com.iqms.backend.repository;

import com.iqms.backend.model.SheetComment;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SheetCommentRepository extends MongoRepository<SheetComment, String> {
  List<SheetComment> findTop100BySheetIdOrderByCreatedAtDesc(String sheetId);
}
