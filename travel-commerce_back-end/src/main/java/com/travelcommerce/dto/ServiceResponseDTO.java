package com.travelcommerce.dto;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponseDTO {
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
    
    private Status status;
    private Date createdAt;

    // computed/transient values
    private Double averageRating;
    private Long reviewCount;

    public static ServiceResponseDTO from(ServicePost post) {
        if (post == null) return null;
        return new ServiceResponseDTO(
                post.getId(),
                post.getProviderId(),
                post.getTitle(),
                post.getDescription(),
                post.getDistrict(),
                post.getLocation(),
                post.getCategory(),
                post.getImages(),
                post.getPlanId(),
                post.getPlanName(),
                post.getPriceFrom(),
                post.getPriceTo(),
                post.getPriceUnit(),
                post.getCurrency(),
                post.getStatus(),
                post.getCreatedAt(),
                post.getAverageRating(),
                post.getReviewCount()
        );
    }
}
