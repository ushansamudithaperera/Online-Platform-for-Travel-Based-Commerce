// src/main/java/com/travelcommerce/repository/ServiceRepository.java

package com.travelcommerce.repository;

import com.travelcommerce.model.ServicePost;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ServiceRepository extends MongoRepository<ServicePost, String> {

    // ==================================================================================
    // 🟢 TEAMMATES' ORIGINAL METHODS (DO NOT TOUCH)
    // ==================================================================================
    
    List<ServicePost> findByProviderId(String providerId); 
    List<ServicePost> findByDistrict(String district);

    // ==================================================================================
    // 🔴 MY ADMIN EXTENSIONS (REQUIRED FOR SEARCH)
    // ==================================================================================

    // This allows the Admin Dashboard to search by Title OR Category
    List<ServicePost> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(String title, String category);
}


// // src/main/java/com/travelcommerce/repository/ServiceRepository.java

// package com.travelcommerce.repository;

// import com.travelcommerce.model.ServicePost;
// import org.springframework.data.mongodb.repository.MongoRepository;

// import java.util.List;

// public interface ServiceRepository extends MongoRepository<ServicePost, String> {
//     List<ServicePost> findByProviderId(String providerId); // ⬅️ CRITICAL FIX: Add this method
//     List<ServicePost> findByDistrict(String district);
// }