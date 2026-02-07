package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Transient;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
@Document("reviews")
public class Review {
    @Id
    private String id;
    private String travellerId;
    private String travellerName;
    private String serviceId;
    private int rating; // 1-5
    private String comment;
    private Date createdAt = new Date();
    
    // For nested comments/replies
    private String parentReviewId; // null for top-level comments, points to parent for replies
    
    @Transient // Not stored in DB, populated at runtime
    private List<Review> replies = new ArrayList<>();
}
