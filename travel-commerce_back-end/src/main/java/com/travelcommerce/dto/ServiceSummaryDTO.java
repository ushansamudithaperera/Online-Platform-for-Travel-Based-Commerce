package com.travelcommerce.dto;

import com.travelcommerce.model.ServicePost;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceSummaryDTO {
    private String id;
    private String title;
    private String category;
    private String district;
    private Double priceFrom;
    private Double priceTo;
    private String priceUnit;
    private String currency;
    private String description;

    public static ServiceSummaryDTO from(ServicePost post) {
        if (post == null) return null;
        // Strip HTML tags from description for a clean text summary
        String plainDesc = post.getDescription() != null
                ? post.getDescription().replaceAll("<[^>]+>", "").replaceAll("&nbsp;", " ").trim()
                : "";
        // Truncate to keep prompt size manageable
        if (plainDesc.length() > 200) {
            plainDesc = plainDesc.substring(0, 197) + "...";
        }
        return new ServiceSummaryDTO(
                post.getId(),
                post.getTitle(),
                post.getCategory(),
                post.getDistrict(),
                post.getPriceFrom(),
                post.getPriceTo(),
                post.getPriceUnit(),
                post.getCurrency(),
                plainDesc
        );
    }
}
