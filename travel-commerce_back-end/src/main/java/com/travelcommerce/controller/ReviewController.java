
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
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

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

    // Get reviews for a service (public) - Returns nested structure
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Review>> getServiceReviews(@PathVariable String serviceId) {
        // Get all reviews for this service
        List<Review> allReviews = reviewRepository.findByServiceId(serviceId);
        
        // Build nested structure
        Map<String, Review> reviewMap = new HashMap<>();
        List<Review> topLevelReviews = new ArrayList<>();
        
        // First, organize all reviews by ID
        for (Review review : allReviews) {
            reviewMap.put(review.getId(), review);
            review.setReplies(new ArrayList<>()); // Initialize replies list
        }
        
        // Then, build the tree structure
        for (Review review : allReviews) {
            if (review.getParentReviewId() == null || review.getParentReviewId().isEmpty()) {
                // Top-level review
                topLevelReviews.add(review);
            } else {
                // Reply - add to parent's replies list
                Review parent = reviewMap.get(review.getParentReviewId());
                if (parent != null) {
                    parent.getReplies().add(review);
                }
            }
        }
        
        return ResponseEntity.ok(topLevelReviews);
    }
    
    // Create a reply to a review
    @PostMapping("/{parentReviewId}/reply")
    public ResponseEntity<?> createReply(
            @PathVariable String parentReviewId,
            @RequestBody Review reply,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "User not found", null));
        }
        
        // Verify parent review exists
        Review parentReview = reviewRepository.findById(parentReviewId).orElse(null);
        if (parentReview == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Parent review not found", null));
        }

        reply.setTravellerId(userId);
        reply.setTravellerName(user.getFullname());
        reply.setParentReviewId(parentReviewId);
        reply.setServiceId(parentReview.getServiceId()); // Inherit service ID from parent
        reply.setRating(0); // Replies don't have ratings

        Review saved = reviewRepository.save(reply);
        return ResponseEntity.ok(new ApiResponse(true, "Reply submitted successfully", Map.of("reply", saved)));
    }
    
    // Update/Edit review
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(@PathVariable String id, @RequestBody Review updatedReview, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        Review existingReview = reviewRepository.findById(id).orElse(null);
        
        if (existingReview == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Review not found", null));
        }

        // Only the owner can edit their review
        if (!existingReview.getTravellerId().equals(userId)) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to edit this review", null));
        }

        // Update only editable fields
        existingReview.setComment(updatedReview.getComment());
        if (existingReview.getParentReviewId() == null || existingReview.getParentReviewId().isEmpty()) {
            // Only top-level reviews can have ratings
            existingReview.setRating(updatedReview.getRating());
        }

        Review saved = reviewRepository.save(existingReview);
        return ResponseEntity.ok(new ApiResponse(true, "Review updated successfully", Map.of("review", saved)));
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

    // Delete review (and all its replies)
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

        // If this is a top-level review, also delete all its replies
        if (review.getParentReviewId() == null || review.getParentReviewId().isEmpty()) {
            List<Review> replies = reviewRepository.findByParentReviewId(id);
            for (Review reply : replies) {
                reviewRepository.deleteById(reply.getId());
            }
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
