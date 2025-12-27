package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType; // Added missing import
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired private ServicePostService servicePostService;
    @Autowired private UserRepository userRepository;

    // GET /api/services
    @GetMapping
    public ResponseEntity<List<ServicePost>> all() {
        return ResponseEntity.ok(servicePostService.findAll());
    }

    // GET /api/services/{id}
    @GetMapping("{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        ServicePost p = servicePostService.findById(id);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

    // GET /api/services/provider-posts 
    @GetMapping("/provider-posts")
    public ResponseEntity<List<ServicePost>> getProviderPosts(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build(); 
        }
        String providerId = auth.getName(); 
        List<ServicePost> posts = servicePostService.findByProviderId(providerId);
        return ResponseEntity.ok(posts);
    }
    
    // POST /api/services (Create) - UPDATED TO HANDLE MULTIPART
    // Note: The old JSON create method was removed to fix the duplicate mapping error
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> create(
            @RequestPart("title") String title,
            @RequestPart("description") String description,
            @RequestPart("district") String district,
            @RequestPart("location") String location,
            @RequestPart("category") String category,
            @RequestPart("planId") String planId,
            @RequestPart("planName") String planName, 
            @RequestPart("images") List<MultipartFile> images, 
            Authentication auth) {
        
        if (auth == null) return ResponseEntity.status(401).body("Unauthorized");
        
        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() != Role.ROLE_PROVIDER) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        ServicePost post = new ServicePost();
        post.setTitle(title);
        post.setDescription(description);
        post.setDistrict(district);
        post.setLocation(location);
        post.setCategory(category);
        post.setPlanId(planId);
        post.setProviderId(userId);

        ServicePost saved = servicePostService.createWithImages(post, images);
        return ResponseEntity.ok(saved);
    }

    // Helper for stand-alone image uploads
    @PostMapping("/upload/images")
    public ResponseEntity<?> uploadImages(@RequestParam("images") List<MultipartFile> files) {
        List<String> imageUrls = servicePostService.uploadFiles(files);
        return ResponseEntity.ok(imageUrls);
    }

    // DELETE /api/services/{id}
    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        ServicePost existing = servicePostService.findById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        String userId = auth != null ? auth.getName() : null;
        if (userId == null) return ResponseEntity.status(401).body("Unauthorized");
        User user = userRepository.findById(userId).orElse(null);
        
        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;
        
        if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");
        servicePostService.delete(id);
        return ResponseEntity.ok("Deleted");
    }
}