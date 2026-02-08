package com.travelcommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmartSearchInterpretationDTO {
    /** Original raw query from the traveller. */
    private String originalQuery;

    /** High-level intent label such as romantic/transport/food/stay/adventure/general. */
    private String intent;

    /** Optional place name mentioned (e.g., "Sigiriya") when recognized. */
    private String place;

    /** Resolved district name (e.g., "Matale") when recognized. */
    private String district;

    /** Nearby districts used for fallback recommendations. */
    private List<String> nearbyDistricts;

    /** Suggested service categories (normalized keys such as hotel/restaurant/driver/tour_guide/experience). */
    private List<String> suggestedCategories;

    /** How results were chosen: district|nearby|category|keyword|fallback|none. */
    private String strategy;
}
