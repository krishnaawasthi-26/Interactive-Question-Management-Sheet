package com.iqms.backend.repository;

import com.iqms.backend.model.PushSubscription;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PushSubscriptionRepository extends MongoRepository<PushSubscription, String> {
  Optional<PushSubscription> findByUserIdAndEndpoint(String userId, String endpoint);
}
