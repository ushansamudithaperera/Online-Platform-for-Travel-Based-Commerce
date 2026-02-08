package com.travelcommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmartSearchResponseDTO {
    /** Natural-language explanation of how the AI understood the query and why results are shown. */
    private String explanation;

    /** Structured interpretation (intent/location/categories) to support UI transparency. */
    private SmartSearchInterpretationDTO interpretation;

    /** IDs of matched / recommended posts in relevance order. */
    private List<String> matchedPostIds;
}
