package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {
    @Autowired private ServicePostService servicePostService;
    @Autowired private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ServicePost>> all() {
        return ResponseEntity.ok(servicePostService.findAll());
    }

    @GetMapping("{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        ServicePost p = servicePostService.findById(id);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

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
