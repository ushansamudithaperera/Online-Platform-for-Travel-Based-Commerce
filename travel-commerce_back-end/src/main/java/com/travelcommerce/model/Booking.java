package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Document("bookings")
public class Booking {
    @Id
    private String id;
    private String travellerId;
    private String travellerName;
    private String serviceId;
    private String serviceTitle;
    private String providerId;
    private Date bookingDate;
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, COMPLETED
    private String contactEmail;
    private String contactPhone;
    private String message;
    private Date createdAt = new Date();
}
