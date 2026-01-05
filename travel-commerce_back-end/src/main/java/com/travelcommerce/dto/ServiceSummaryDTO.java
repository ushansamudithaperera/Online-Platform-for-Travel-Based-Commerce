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

    public static ServiceSummaryDTO from(ServicePost post) {
        if (post == null) return null;
        return new ServiceSummaryDTO(
                post.getId(),
                post.getTitle(),
                post.getCategory(),
                post.getDistrict()
        );
    }
}
