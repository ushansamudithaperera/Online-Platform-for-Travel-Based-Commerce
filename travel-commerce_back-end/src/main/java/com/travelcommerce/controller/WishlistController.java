package com.travelcommerce.controller;

import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.dto.ServiceResponseDTO;
import com.travelcommerce.model.ServicePost;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private ServicePostService servicePostService;

    @PostMapping("/toggle/{serviceId}")
    public ResponseEntity<?> toggle(@PathVariable String serviceId, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
        }

        String userId = auth.getName();

        ServicePost exists = servicePostService.findById(serviceId);
        if (exists == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Service not found"));
        }

        boolean favorited = wishlistService.toggle(userId, serviceId);
        return ResponseEntity.ok(
                new ApiResponse(true, favorited ? "Added to wishlist" : "Removed from wishlist", Map.of("favorited", favorited))
        );
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponseDTO>> getWishlist(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }
        String userId = auth.getName();
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<String>> getWishlistIds(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }
        String userId = auth.getName();
        return ResponseEntity.ok(wishlistService.getWishlistIds(userId));
    }
}
