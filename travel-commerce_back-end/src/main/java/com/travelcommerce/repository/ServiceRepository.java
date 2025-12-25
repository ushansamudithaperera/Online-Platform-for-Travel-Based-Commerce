//new edit 

package com.travelcommerce.repository;

import com.travelcommerce.model.ServicePost;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ServiceRepository extends MongoRepository<ServicePost, String> {
    
    // Existing method for Provider Dashboard
    List<ServicePost> findByProviderId(String providerId);

    // 🚨 NEW SEARCH METHODS ADDED 🚨
    List<ServicePost> findByDistrict(String district);
    List<ServicePost> findByCategory(String category);
    List<ServicePost> findByCategoryAndDistrict(String category, String district);
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