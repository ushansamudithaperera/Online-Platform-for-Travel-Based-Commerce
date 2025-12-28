// src/main/java/com/travelcommerce/repository/ServiceRepository.java

package com.travelcommerce.repository;

import com.travelcommerce.model.ServicePost;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ServiceRepository extends MongoRepository<ServicePost, String> {
    List<ServicePost> findByProviderId(String providerId); // ⬅️ CRITICAL FIX: Add this method
    List<ServicePost> findByDistrict(String district);
}