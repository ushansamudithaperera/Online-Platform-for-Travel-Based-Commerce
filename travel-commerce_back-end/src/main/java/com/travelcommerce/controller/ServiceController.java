package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired private ServicePostService servicePostService;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;


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

    // CREATE - multipart/form-data with JSON + images
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestPart("serviceData") String serviceDataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body("Unauthorized");

        try {
            String userId = auth.getName();
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getRole() != Role.ROLE_PROVIDER) {
                return ResponseEntity.status(403).body("Forbidden");
            }

            Map<String, Object> serviceData = objectMapper.readValue(serviceDataJson, Map.class);

            ServicePost post = new ServicePost();
            post.setTitle((String) serviceData.get("title"));
            post.setDescription((String) serviceData.get("description"));
            post.setDistrict((String) serviceData.get("district"));
            post.setLocation((String) serviceData.get("location"));
            post.setCategory((String) serviceData.get("category"));
            post.setPlanId((String) serviceData.get("planId"));
            post.setPlanName((String) serviceData.get("planName"));
            post.setProviderId(userId);

            ServicePost saved;
            if (images != null && !images.isEmpty()) {
                System.out.println("Uploading " + images.size() + " image(s)");
                saved = servicePostService.createWithImages(post, images);
                System.out.println("Image URLs saved: " + saved.getImages());
            } else {
                saved = servicePostService.create(post);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating service: " + e.getMessage());
        }
    }

    // EDIT - JSON only (no images, no plan change)
// EDIT - JSON ONLY (no images, if used elsewhere)
@PutMapping(value = "{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<?> updateJson(
        @PathVariable String id,
        @RequestBody ServicePost updated,
        Authentication auth) {

    if (auth == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    ServicePost existing = servicePostService.findById(id);
    if (existing == null) {
        return ResponseEntity.notFound().build();
    }

    String userId = auth.getName();
    User user = userRepository.findById(userId).orElse(null);

    boolean owner = existing.getProviderId().equals(userId);
    boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

    if (!owner && !isAdmin) {
        return ResponseEntity.status(403).body("Forbidden");
    }

    existing.setTitle(updated.getTitle());
    existing.setDescription(updated.getDescription());
    existing.setDistrict(updated.getDistrict());
    existing.setLocation(updated.getLocation());
    existing.setCategory(updated.getCategory());

    ServicePost saved = servicePostService.update(existing);
    return ResponseEntity.ok(saved);
}

// EDIT WITH IMAGES - multipart/form-data
@PutMapping(value = "{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> updateWithImages(
        @PathVariable String id,
        @RequestPart("serviceData") String serviceDataJson,
        @RequestPart(value = "images", required = false) List<MultipartFile> images,
        Authentication auth) {

    if (auth == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    ServicePost existing = servicePostService.findById(id);
    if (existing == null) {
        return ResponseEntity.notFound().build();
    }

    String userId = auth.getName();
    User user = userRepository.findById(userId).orElse(null);

    boolean owner = existing.getProviderId().equals(userId);
    boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

    if (!owner && !isAdmin) {
        return ResponseEntity.status(403).body("Forbidden");
    }

    try {
        Map<String, Object> data = objectMapper.readValue(serviceDataJson, Map.class);

        existing.setTitle((String) data.get("title"));
        existing.setDescription((String) data.get("description"));
        existing.setDistrict((String) data.get("district"));
        existing.setLocation((String) data.get("location"));
        existing.setCategory((String) data.get("category"));

        // images to keep (existingImages array from frontend)
        List<String> finalImages = new java.util.ArrayList<>();
        Object keepObj = data.get("existingImages");
        if (keepObj instanceof List<?>) {
            for (Object o : (List<?>) keepObj) {
                if (o != null) {
                    finalImages.add(o.toString());
                }
            }
        }

        // upload new images and append
        if (images != null && !images.isEmpty()) {
            List<String> newUrls = servicePostService.uploadFiles(images);
            finalImages.addAll(newUrls);
        }

        existing.setImages(finalImages);

        ServicePost saved = servicePostService.update(existing);
        return ResponseEntity.ok(saved);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.badRequest().body("Error updating service: " + e.getMessage());
    }
}


    // Stand-alone image upload if needed
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