package com.travelcommerce.controller;

import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.model.Feedback;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.repository.FeedbackRepository;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody Feedback feedback, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String userId = authentication.getName();
            User user = userRepository.findById(userId).orElse(null);

            if (user != null) {
                // Auto-fill from logged-in user
                feedback.setName(user.getFullname());
                feedback.setEmail(user.getEmail());
            }
        }

        // Basic validation
        if (feedback.getMessage() == null || feedback.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Message is required", null));
        }

        Feedback savedFeedback = feedbackRepository.save(feedback);
        return ResponseEntity.ok(new ApiResponse(true, "Feedback submitted successfully", savedFeedback));
    }

    @GetMapping
    public ResponseEntity<?> getAllFeedback(Authentication authentication) {
        // Only Admin can view all feedback
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = authentication.getName();
        User user = userRepository.findById(userId).orElse(null);

        if (user == null || user.getRole() != Role.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Access Denied", null));
        }

        List<Feedback> feedbacks = feedbackRepository.findAll();
        return ResponseEntity.ok(feedbacks);
    }
}
