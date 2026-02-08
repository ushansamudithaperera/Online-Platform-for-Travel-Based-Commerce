package com.travelcommerce.service;

import com.travelcommerce.model.Notification;
import com.travelcommerce.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

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
}
