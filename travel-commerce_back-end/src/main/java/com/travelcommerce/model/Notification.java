package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document("notifications")
public class Notification {
    @Id
    private String id;

    private String recipientId;      // userId who should see this notification
    private String senderId;         // userId who triggered the notification
    private String senderName;       // display name of the sender

    private String type;             // BOOKING_NEW, BOOKING_CONFIRMED, BOOKING_CANCELLED,
                                     // BOOKING_COMPLETED, BOOKING_DELETED,
                                     // REVIEW_NEW, REVIEW_REPLY, REVIEW_DELETED,
                                     // ADMIN_MESSAGE, SERVICE_APPROVED, SERVICE_REJECTED,
                                     // SERVICE_DELETED, USER_REMOVED, NEW_SERVICE_POSTED,
                                     // NEW_USER_REGISTERED

    private String message;          // human-readable notification text
    private String relatedId;        // bookingId or reviewId
    private String serviceId;        // related service (for navigation)
    private String serviceTitle;     // for display without extra lookup

    private boolean read = false;
    private Date createdAt = new Date();
}
