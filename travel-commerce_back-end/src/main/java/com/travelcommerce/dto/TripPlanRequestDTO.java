package com.travelcommerce.dto;

import lombok.Data;

@Data
public class TripPlanRequestDTO {
    private String userQuery;
    private Integer numDays;
}
