package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;
import java.util.List;
import java.util.Date;

@Data
@Document("services")
public class ServicePost {
    @Id
    private String id;
    private String providerId;
    private String title;
    private String description;
    private String district;
    private String location;
    private String category;
    private List<String> images;
    private String planId;
    private String planName; 
    
    // Pricing fields
    private Double priceFrom;
    private Double priceTo;
    private String priceUnit;
    private String currency;
    
    // External booking site
    private String externalBookingUrl;

    // Provider WhatsApp number (optional)
    private String whatsappNumber;

    // Provider-defined offerings (e.g., room types, vehicle types, languages)
    private Map<String, List<String>> serviceOfferings;
    
    private Status status = Status.PENDING;
    private Date createdAt = new Date();

    @Transient
    private Double averageRating;

    @Transient
    private Long reviewCount;
}