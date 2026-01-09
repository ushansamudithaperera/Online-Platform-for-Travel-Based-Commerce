
package com.travelcommerce.controller;

import com.travelcommerce.model.Review;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role; // 🟢 ADDED THIS IMPORT
import com.travelcommerce.repository.ReviewRepository;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*", maxAge = 3600) // 🟢 ADDED CORS TO BE SAFE
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Create review
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "User not found", null));
        }

        review.setTravellerId(userId);
        review.setTravellerName(user.getFullname());

        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(new ApiResponse(true, "Review submitted successfully", Map.of("review", saved)));
    }

    // 🟢 NEW: Get ALL reviews (For Admin Dashboard)
    @GetMapping
    public ResponseEntity<?> getAllReviews(Authentication auth) {
        // Security Check: Is it an Admin?
        if (auth == null) return ResponseEntity.status(401).build();
        
        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null || user.getRole() != Role.ROLE_ADMIN) {
             return ResponseEntity.status(403).body(new ApiResponse(false, "Access Denied", null));
        }

        return ResponseEntity.ok(reviewRepository.findAll());
    }

    // Get reviews for a service (public)
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Review>> getServiceReviews(@PathVariable String serviceId) {
        List<Review> reviews = reviewRepository.findByServiceId(serviceId);
        return ResponseEntity.ok(reviews);
    }

    // Get traveller's reviews
    @GetMapping("/my-reviews")
    public ResponseEntity<List<Review>> getMyReviews(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = auth.getName();
        List<Review> reviews = reviewRepository.findByTravellerId(userId);
        return ResponseEntity.ok(reviews);
    }

    // Delete review
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        
        // Load User to check Role
        User user = userRepository.findById(userId).orElse(null);
        Review review = reviewRepository.findById(id).orElse(null);
        
        if (review == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Review not found", null));
        }

        // 🟢 MODIFIED LOGIC: Allow Owner OR Admin
        boolean isOwner = review.getTravellerId().equals(userId);
        boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to delete this review", null));
        }

        reviewRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse(true, "Review deleted", null));
    }
}




// change by allowing the write and the admin both to delete reviews


// package com.travelcommerce.controller;

// import com.travelcommerce.model.Review;
// import com.travelcommerce.model.User;
// import com.travelcommerce.repository.ReviewRepository;
// import com.travelcommerce.repository.UserRepository;
// import com.travelcommerce.dto.ApiResponse;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.Authentication;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/reviews")
// public class ReviewController {

//     @Autowired
//     private ReviewRepository reviewRepository;
    
//     @Autowired
//     private UserRepository userRepository;

//     // Create review
//     @PostMapping
//     public ResponseEntity<?> createReview(@RequestBody Review review, Authentication auth) {
//         if (auth == null) {
//             return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
//         }

//         String userId = auth.getName();
//         User user = userRepository.findById(userId).orElse(null);
        
//         if (user == null) {
//             return ResponseEntity.status(404).body(new ApiResponse(false, "User not found", null));
//         }

//         review.setTravellerId(userId);
//         review.setTravellerName(user.getFullname());

//         Review saved = reviewRepository.save(review);
//         return ResponseEntity.ok(new ApiResponse(true, "Review submitted successfully", Map.of("review", saved)));
//     }

//     // Get reviews for a service (public)
//     @GetMapping("/service/{serviceId}")
//     public ResponseEntity<List<Review>> getServiceReviews(@PathVariable String serviceId) {
//         List<Review> reviews = reviewRepository.findByServiceId(serviceId);
//         return ResponseEntity.ok(reviews);
//     }

//     // Get traveller's reviews
//     @GetMapping("/my-reviews")
//     public ResponseEntity<List<Review>> getMyReviews(Authentication auth) {
//         if (auth == null) {
//             return ResponseEntity.status(401).build();
//         }

//         String userId = auth.getName();
//         List<Review> reviews = reviewRepository.findByTravellerId(userId);
//         return ResponseEntity.ok(reviews);
//     }

//     // Delete review
//     @DeleteMapping("/{id}")
//     public ResponseEntity<?> deleteReview(@PathVariable String id, Authentication auth) {
//         if (auth == null) {
//             return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
//         }

//         String userId = auth.getName();
//         Review review = reviewRepository.findById(id).orElse(null);
        
//         if (review == null) {
//             return ResponseEntity.status(404).body(new ApiResponse(false, "Review not found", null));
//         }

//         if (!review.getTravellerId().equals(userId)) {
//             return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to delete this review", null));
//         }

//         reviewRepository.deleteById(id);
//         return ResponseEntity.ok(new ApiResponse(true, "Review deleted", null));
//     }
// }
