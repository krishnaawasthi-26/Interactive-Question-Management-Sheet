package com.iqms.backend.repository;

import com.iqms.backend.model.PremiumPaymentOrder;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PremiumPaymentOrderRepository extends MongoRepository<PremiumPaymentOrder, String> {
  Optional<PremiumPaymentOrder> findByRazorpayOrderId(String razorpayOrderId);
}
