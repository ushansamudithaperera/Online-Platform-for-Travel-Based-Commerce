package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/pending-posts")
    public ResponseEntity<List<ServicePost>> pendingPosts() {
        return ResponseEntity.ok(serviceRepository.findAll().stream().filter(s -> s.getStatus() == com.travelcommerce.model.Status.PENDING || s.getStatus() == com.travelcommerce.model.Status.ACTIVE && false).toList());
    }

    @PostMapping("/posts/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id) {
        ServicePost s = serviceRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();
        s.setStatus(com.travelcommerce.model.Status.ACTIVE);
        serviceRepository.save(s);
        return ResponseEntity.ok("Approved");
    }

    @PostMapping("/posts/{id}/ban")
    public ResponseEntity<?> ban(@PathVariable String id) {
        ServicePost s = serviceRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();
        s.setStatus(com.travelcommerce.model.Status.BANNED);
        serviceRepository.save(s);
        return ResponseEntity.ok("Banned");
    }
}
