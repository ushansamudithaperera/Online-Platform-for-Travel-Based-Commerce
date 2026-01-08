package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

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
}
