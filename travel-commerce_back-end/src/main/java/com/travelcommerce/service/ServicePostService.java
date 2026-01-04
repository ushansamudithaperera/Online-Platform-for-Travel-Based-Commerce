// src/main/java/com/travelcommerce/service/ServicePostService.java

package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicePostService {
    @Autowired private ServiceRepository repo;

    @Autowired
    private ServiceRepository repo;

    @Autowired
    private ReviewRepository reviewRepository;
    // ==================================================================================
    // 🟢 TEAMMATES' ORIGINAL CODE (DO NOT TOUCH - KEEPS APP WORKING)
    // ==================================================================================

    public List<ServicePost> findAll() {
        List<ServicePost> posts = repo.findAll();
        attachRatings(posts);
        return posts;
    public List<ServicePost> findAll() { 
        // Assuming this fetches published/active posts for the Traveller Dashboard
        return repo.findAll(); 
    }
    
    // ⬅️ CRITICAL FIX: Add the missing method implementation
    public List<ServicePost> findByProviderId(String providerId) {
        return repo.findByProviderId(providerId); // Calls the method defined in the repository
    }
    
    public ServicePost findById(String id) { return repo.findById(id).orElse(null); }
    public ServicePost create(ServicePost p) { return repo.save(p); }
    public ServicePost update(ServicePost p) { return repo.save(p); }
    public void delete(String id) { repo.deleteById(id); }
}