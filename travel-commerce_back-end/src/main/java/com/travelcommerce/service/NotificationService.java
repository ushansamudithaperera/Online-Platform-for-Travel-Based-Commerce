package com.travelcommerce.service;

import com.travelcommerce.model.Notification;
import com.travelcommerce.model.Role;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.NotificationRepository;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create and save a notification.
     */
    public Notification createNotification(
            String recipientId,
            String senderId,
            String senderName,
            String type,
            String message,
            String relatedId,
            String serviceId,
            String serviceTitle
    ) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setSenderId(senderId);
        notification.setSenderName(senderName);
        notification.setType(type);
        notification.setMessage(message);
        notification.setRelatedId(relatedId);
        notification.setServiceId(serviceId);
        notification.setServiceTitle(serviceTitle);
        notification.setRead(false);
        notification.setCreatedAt(new Date());

        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for a user (newest first).
     */
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread count for a user.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    /**
     * Mark a single notification as read.
     */
    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && notification.getRecipientId().equals(userId)) {
            notification.setRead(true);
            return notificationRepository.save(notification);
        }
        return notification;
    }

    /**
     * Mark all notifications as read for a user.
     */
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    /**
     * Delete a notification.
     */
    public void deleteNotification(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && notification.getRecipientId().equals(userId)) {
            notificationRepository.deleteById(notificationId);
        }
    }

    /**
     * Delete all notifications for a user.
     */
    public void deleteAllForUser(String userId) {
        List<Notification> all = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(all);
    }

    /**
     * Notify all admin users about an event.
     */
    public void notifyAllAdmins(
            String senderId,
            String senderName,
            String type,
            String message,
            String relatedId,
            String serviceId,
            String serviceTitle
    ) {
        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
        for (User admin : admins) {
            createNotification(
                admin.getId(),
                senderId,
                senderName,
                type,
                message,
                relatedId,
                serviceId,
                serviceTitle
            );
        }
    }

    /**
     * Admin sends a notification to a specific user.
     */
    public Notification adminSendNotification(
            String adminId,
            String adminName,
            String recipientId,
            String message
    ) {
        return createNotification(
            recipientId,
            adminId,
            adminName,
            "ADMIN_MESSAGE",
            message,
            null,
            null,
            null
        );
    }

    /**
     * Admin broadcasts a notification to all users of a specific role, or all users.
     */
    public int adminBroadcast(
            String adminId,
            String adminName,
            String message,
            String targetRole  // "ALL", "ROLE_TRAVELLER", "ROLE_PROVIDER"
    ) {
        List<User> recipients;
        if ("ROLE_TRAVELLER".equals(targetRole)) {
            recipients = userRepository.findByRole(Role.ROLE_TRAVELLER);
        } else if ("ROLE_PROVIDER".equals(targetRole)) {
            recipients = userRepository.findByRole(Role.ROLE_PROVIDER);
        } else {
            // ALL — get travellers + providers (exclude admins from broadcast)
            recipients = new java.util.ArrayList<>(userRepository.findByRole(Role.ROLE_TRAVELLER));
            recipients.addAll(userRepository.findByRole(Role.ROLE_PROVIDER));
        }

        for (User user : recipients) {
            createNotification(
                user.getId(),
                adminId,
                adminName,
                "ADMIN_MESSAGE",
                message,
                null,
                null,
                null
            );
        }
        return recipients.size();
    }
}
