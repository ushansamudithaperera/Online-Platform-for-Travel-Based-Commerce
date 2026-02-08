package com.travelcommerce.controller;

import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.model.Notification;
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
}
