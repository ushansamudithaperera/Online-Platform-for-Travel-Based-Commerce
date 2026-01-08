package com.travelcommerce.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.travelcommerce.dto.TripPlanRequestDTO;
import com.travelcommerce.service.AITripPlannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
            return ResponseEntity.status(500).body("Trip planner failed: " + e.getMessage());
        }
    }
}
