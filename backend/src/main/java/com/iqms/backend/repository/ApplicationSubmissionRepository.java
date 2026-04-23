package com.iqms.backend.repository;

import com.iqms.backend.model.ApplicationSubmission;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ApplicationSubmissionRepository extends MongoRepository<ApplicationSubmission, String> {
  boolean existsByNormalizedEmailAndNormalizedFieldAndApplicationMonthKeyAndApplicationStatusIn(
      String normalizedEmail,
      String normalizedField,
      String applicationMonthKey,
      Iterable<String> statuses);

  boolean existsByNormalizedPhoneAndNormalizedFieldAndApplicationMonthKeyAndApplicationStatusIn(
      String normalizedPhone,
      String normalizedField,
      String applicationMonthKey,
      Iterable<String> statuses);

  Optional<ApplicationSubmission> findByPaymentOrderId(String paymentOrderId);
}
