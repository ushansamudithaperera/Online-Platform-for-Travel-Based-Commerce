package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.Map;

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
    private String category; // tour_guide, driver, hotel, experience, restaurant
    private Map<String, Object> bookingDetails; // Dynamic fields based on category
    private Map<String, Object> pricingDetails; // Pricing info set by provider
    private Date bookingDate;
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, COMPLETED
    // When true, booking is hidden from traveller's "My Bookings" view (provider still sees it)
    private boolean hiddenByTraveller = false;
    private String contactEmail;
    private String contactPhone;
    private String message;
    private Date createdAt = new Date();
    private Date updatedAt = new Date();
}
