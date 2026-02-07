package com.travelcommerce.repository;

import com.travelcommerce.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByServiceId(String serviceId);
    List<Review> findByTravellerId(String travellerId);
    List<Review> findByParentReviewId(String parentReviewId);
    List<Review> findByServiceIdAndParentReviewIdIsNull(String serviceId); // Get only top-level reviews
}
