package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication; // Needed to get authenticated user details

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {
    @Autowired private ServicePostService servicePostService;
    @Autowired private UserRepository userRepository;

    // GET /api/services (Used by Traveller Dashboard - fetches ALL published posts)
    @GetMapping
    public ResponseEntity<List<ServicePost>> all() {
        // Assuming servicePostService.findAll() only returns ACTIVE/Published posts.
        return ResponseEntity.ok(servicePostService.findAll());
    }

    // GET /api/services/{id}
    @GetMapping("{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        ServicePost p = servicePostService.findById(id);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

    // 🚨 NEW ENDPOINT: GET /api/services/provider-posts 
    // Purpose: Fetch all posts belonging to the authenticated provider.
    // This is the method that caused the type mismatch error.
    @GetMapping("/provider-posts")
    public ResponseEntity<List<ServicePost>> getProviderPosts(Authentication auth) {
        
        // 🛑 CRITICAL FIX: If unauthorized (token invalid), return 401 without a specific List body.
        // This resolves the Type mismatch error (cannot convert from ResponseEntity<String> to ResponseEntity<List<ServicePost>>)
        if (auth == null) {
            return ResponseEntity.status(401).build(); 
        }
        
        String providerId = auth.getName(); 
        
        // Call the service layer to retrieve posts filtered by this ID.
        // Assumes findByProviderId has been added to ServicePostService and ServiceRepository.
        List<ServicePost> posts = servicePostService.findByProviderId(providerId);
        
        return ResponseEntity.ok(posts);
    }
    
    // POST /api/services (Create)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ServicePost post, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body("Unauthorized");
        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() != Role.ROLE_PROVIDER) return ResponseEntity.status(403).body("Only providers can create services");
        post.setProviderId(user.getId());
        post.setStatus(com.travelcommerce.model.Status.PENDING);
        ServicePost saved = servicePostService.create(post);
        return ResponseEntity.ok(saved);
    }

    // PUT /api/services/{id} (Update)
    @PutMapping("{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ServicePost body, Authentication auth) {
        ServicePost existing = servicePostService.findById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        String userId = auth != null ? auth.getName() : null;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;
        if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");

        existing.setTitle(body.getTitle());
        existing.setDescription(body.getDescription());
        existing.setDistrict(body.getDistrict());
        existing.setLocation(body.getLocation());
        existing.setCategory(body.getCategory());
        existing.setImages(body.getImages());
        existing.setPlanId(body.getPlanId());

        ServicePost saved = servicePostService.update(existing);
        return ResponseEntity.ok(saved);
    }

    // DELETE /api/services/{id} (Delete)
    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        ServicePost existing = servicePostService.findById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        String userId = auth != null ? auth.getName() : null;
        if (userId == null) return ResponseEntity.status(401).body("Unauthorized");
        User user = userRepository.findById(userId).orElse(null);
        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;
        if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");
        servicePostService.delete(id);
        return ResponseEntity.ok("Deleted");
    }
}