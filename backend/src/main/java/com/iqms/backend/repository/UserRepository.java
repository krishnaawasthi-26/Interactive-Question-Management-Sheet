package com.iqms.backend.repository;

import com.iqms.backend.model.User;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
  Optional<User> findByEmail(String email);

  Optional<User> findByProfileShareId(String profileShareId);
}
