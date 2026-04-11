package com.iqms.backend.repository;

import com.iqms.backend.model.NotificationPreferences;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationPreferencesRepository extends MongoRepository<NotificationPreferences, String> {
  Optional<NotificationPreferences> findByUserId(String userId);
}
