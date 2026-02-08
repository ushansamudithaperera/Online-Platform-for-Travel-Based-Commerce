package com.travelcommerce.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.travelcommerce.dto.TripPlanRequestDTO;
import com.travelcommerce.dto.SmartSearchResponseDTO;
import com.travelcommerce.service.AITripPlannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AITripPlannerController {

    private final AITripPlannerService aiTripPlannerService;

    public AITripPlannerController(AITripPlannerService aiTripPlannerService) {
        this.aiTripPlannerService = aiTripPlannerService;
    }

    @PostMapping("/trip-plan")
    public ResponseEntity<?> generateTripPlan(@RequestBody TripPlanRequestDTO request, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            JsonNode result = aiTripPlannerService.generateTripPlan(
                    request == null ? null : request.getUserQuery(),
                    request == null ? null : request.getNumDays()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Trip planner failed");
        }
    }

    @PostMapping("/smart-search")
    public ResponseEntity<?> smartSearch(@RequestBody Map<String, Object> request) {
        try {
            String searchQuery = (String) request.get("searchQuery");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> availablePosts = (List<Map<String, Object>>) request.get("availablePosts");

            if (availablePosts == null) {
                availablePosts = new ArrayList<>();
            }

            System.out.println("Smart search request - Query: " + searchQuery + ", Posts count: " + availablePosts.size());

            SmartSearchResponseDTO response = aiTripPlannerService.smartSearchExplainable(searchQuery, availablePosts);

            System.out.println("Smart search result - Strategy: " + (response.getInterpretation() != null ? response.getInterpretation().getStrategy() : "") +
                    ", Matched IDs: " + (response.getMatchedPostIds() != null ? response.getMatchedPostIds().size() : 0));

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Smart search failed: " + e.getMessage()));
        }
    }
}
