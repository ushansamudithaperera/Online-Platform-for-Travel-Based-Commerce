package com.travelcommerce.controller;

import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.model.Notification;
import com.travelcommerce.model.Role;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    // Get all notifications for current user
    @GetMapping
    public ResponseEntity<?> getMyNotifications(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // Mark a single notification as read
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        Notification notification = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Marked as read", Map.of("notification", notification)));
    }

    // Mark all notifications as read
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read", null));
    }

    // Delete a single notification
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Notification deleted", null));
    }

    // Clear all notifications
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        String userId = auth.getName();
        notificationService.deleteAllForUser(userId);
        return ResponseEntity.ok(new ApiResponse(true, "All notifications cleared", null));
    }

    // ==================================================================================
    // ADMIN: Send notification to a specific user
    // ==================================================================================
    @PostMapping("/admin/send")
    public ResponseEntity<?> adminSendNotification(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String adminId = auth.getName();
        User admin = userRepository.findById(adminId).orElse(null);
        if (admin == null || admin.getRole() != Role.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Admin access required", null));
        }

        String recipientId = body.get("recipientId");
        String message = body.get("message");

        if (recipientId == null || message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "recipientId and message are required", null));
        }

        Notification notification = notificationService.adminSendNotification(
            adminId, admin.getFullname(), recipientId, message
        );

        return ResponseEntity.ok(new ApiResponse(true, "Notification sent", Map.of("notification", notification)));
    }

    // ==================================================================================
    // ADMIN: Broadcast notification to all users (or by role)
    // ==================================================================================
    @PostMapping("/admin/broadcast")
    public ResponseEntity<?> adminBroadcast(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String adminId = auth.getName();
        User admin = userRepository.findById(adminId).orElse(null);
        if (admin == null || admin.getRole() != Role.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Admin access required", null));
        }

        String message = body.get("message");
        String targetRole = body.getOrDefault("targetRole", "ALL"); // ALL, ROLE_TRAVELLER, ROLE_PROVIDER

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "message is required", null));
        }

        int count = notificationService.adminBroadcast(adminId, admin.getFullname(), message, targetRole);

        return ResponseEntity.ok(new ApiResponse(true, "Broadcast sent to " + count + " users", Map.of("recipientCount", count)));
    }
}
