package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document(collection = "wishlists")
public class Wishlist {
    @Id
    private String id;

    private String userId;
    private String serviceId;

    private Date createdAt = new Date();
}
