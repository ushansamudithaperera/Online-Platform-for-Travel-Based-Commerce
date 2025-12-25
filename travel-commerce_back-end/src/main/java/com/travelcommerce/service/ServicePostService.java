//new edit

package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicePostService {
    @Autowired private ServiceRepository repo;

    public List<ServicePost> findAll() { return repo.findAll(); }
    
    public List<ServicePost> findByProviderId(String providerId) {
        return repo.findByProviderId(providerId); 
    }
    
    public ServicePost findById(String id) { return repo.findById(id).orElse(null); }
    public ServicePost create(ServicePost p) { return repo.save(p); }
    public ServicePost update(ServicePost p) { return repo.save(p); }
    public void delete(String id) { repo.deleteById(id); }

    // 🚨 NEW SEARCH LOGIC ADDED 🚨
    public List<ServicePost> searchPosts(String category, String district) {
        if (category != null && !category.isEmpty() && district != null && !district.isEmpty()) {
            // User wants BOTH (e.g. "Hotels" in "Kandy")
            return repo.findByCategoryAndDistrict(category, district);
        } else if (category != null && !category.isEmpty()) {
            // User only wants Category (e.g. "All Hotels")
            return repo.findByCategory(category);
        } else if (district != null && !district.isEmpty()) {
            // User only wants District (e.g. "Everything in Galle")
            return repo.findByDistrict(district);
        } else {
            // User typed nothing? Show everything.
            return repo.findAll();
        }
    }
}











// // src/main/java/com/travelcommerce/service/ServicePostService.java

// package com.travelcommerce.service;

// import com.travelcommerce.model.ServicePost;
// import com.travelcommerce.repository.ServiceRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// import java.util.List;

// @Service
// public class ServicePostService {
//     @Autowired private ServiceRepository repo;

//     public List<ServicePost> findAll() { 
//         // Assuming this fetches published/active posts for the Traveller Dashboard
//         return repo.findAll(); 
//     }
    
//     // ⬅️ CRITICAL FIX: Add the missing method implementation
//     public List<ServicePost> findByProviderId(String providerId) {
//         return repo.findByProviderId(providerId); // Calls the method defined in the repository
//     }
    
//     public ServicePost findById(String id) { return repo.findById(id).orElse(null); }
//     public ServicePost create(ServicePost p) { return repo.save(p); }
//     public ServicePost update(ServicePost p) { return repo.save(p); }
//     public void delete(String id) { repo.deleteById(id); }
// }