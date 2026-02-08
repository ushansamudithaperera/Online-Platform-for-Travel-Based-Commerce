package com.travelcommerce.service;

import com.travelcommerce.dto.SmartSearchResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AITripPlannerServiceExplainableSearchTests {

    private AITripPlannerService newService() {
        // Dependencies are not used by smartSearchExplainable().
        return new AITripPlannerService(null, null, new ObjectMapper());
    }

    private static Map<String, Object> post(String id, String title, String description, String category, String district) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", id);
        m.put("title", title);
        m.put("description", description);
        m.put("category", category);
        m.put("district", district);
        return m;
    }

    @Test
    void sigiriyaResolvesToMataleAndRecommendsMataleServices() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("65a-matale-1", "Mountain View Stay", "A relaxing stay near Dambulla.", "Hotel", "Matale"),
            post("65a-kandy-2", "Kandy City Cafe", "Coffee and brunch.", "Restaurant", "Kandy"),
            post("65a-galle-3", "Galle Fort Walk", "Guided tour.", "Tour Guide", "Galle")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("Sigiriya", posts);

        assertNotNull(resp);
        assertNotNull(resp.getExplanation());
        assertFalse(resp.getExplanation().trim().isEmpty());
        assertTrue(resp.getExplanation().toLowerCase().contains("sigiriya"));
        assertTrue(resp.getExplanation().toLowerCase().contains("matale"));
        assertNotNull(resp.getInterpretation());
        assertEquals("Matale", resp.getInterpretation().getDistrict());

        assertNotNull(resp.getMatchedPostIds());
        assertFalse(resp.getMatchedPostIds().isEmpty());
        assertEquals("65a-matale-1", resp.getMatchedPostIds().get(0));
    }

    @Test
    void nearbyDistrictMatchingHandlesDistrictSuffix() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("m1", "Matale Driver", "Local driver.", "Driver", "Matale District"),
            post("k2", "Kandy Tour", "Temple of the Tooth tour.", "Tour Guide", "Kandy District")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("Sigiriya", posts);

        assertNotNull(resp);
        assertNotNull(resp.getExplanation());
        assertFalse(resp.getExplanation().trim().isEmpty());
        assertNotNull(resp.getMatchedPostIds());

        // Even if Matale has no strong keyword match, district/nearby fallback should find posts.
        assertTrue(resp.getMatchedPostIds().contains("m1") || resp.getMatchedPostIds().contains("k2"));
    }

    @Test
    void romanticIntentSuggestsHotelRestaurantExperience() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("id-10", "Lakefront Dinner", "Candlelight dining.", "Restaurant", "Colombo"),
            post("id-11", "Couple Spa Experience", "Relaxing couple massage.", "Experience", "Colombo"),
            post("id-12", "Airport Pickup", "Fast taxi.", "Driver", "Colombo"),
            // Intentionally keyword-baiting title/description: should NOT be selected for romantic intent
            // when we have category matches (restaurant/experience/hotel).
            post("id-13", "Romantic Dinner Transport", "Best romantic dinner ride.", "Driver", "Colombo")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("I want to date my girlfriend", posts);

        assertNotNull(resp);
        assertNotNull(resp.getExplanation());
        assertFalse(resp.getExplanation().trim().isEmpty());
        assertNotNull(resp.getInterpretation());
        assertEquals("romantic", resp.getInterpretation().getIntent());
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("hotel"));
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("restaurant"));
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("experience"));

        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("id-10"));
        assertTrue(resp.getMatchedPostIds().contains("id-11"));
        // Ensure we are not depending on keyword overlap to pull in unrelated categories.
        assertFalse(resp.getMatchedPostIds().contains("id-13"));
    }

    @Test
    void districtQueryDoesNotIncludeOtherDistrictsWhenMatchesExist() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("k1", "Luxury Hotel", "Nice stay.", "Hotel", "Kandy"),
            post("k2", "City Tour", "Guided tour.", "Tour Guide", "Kandy"),
            post("c1", "Colombo Cafe", "Coffee and brunch.", "Restaurant", "Colombo"),
            post("a1", "Anuradhapura Driver", "Transport.", "Driver", "Anuradhapura")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("i want to go to kandy", posts);

        assertNotNull(resp);
        assertNotNull(resp.getMatchedPostIds());
        assertFalse(resp.getMatchedPostIds().isEmpty());
        assertTrue(resp.getMatchedPostIds().contains("k1"));
        assertTrue(resp.getMatchedPostIds().contains("k2"));
        assertFalse(resp.getMatchedPostIds().contains("c1"));
        assertFalse(resp.getMatchedPostIds().contains("a1"));
    }

    @Test
    void toiletQuerySuggestsHotels() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("h1", "City Hotel", "Clean rooms and facilities.", "Hotel", "Kandy"),
            post("r1", "Local Cafe", "Snacks and drinks.", "Restaurant", "Kandy"),
            post("d1", "Taxi Service", "Transport.", "Driver", "Kandy")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("i want to go to toilet", posts);

        assertNotNull(resp);
        assertNotNull(resp.getInterpretation());
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("hotel"));
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("h1"));
    }

    @Test
    void explanationExistsEvenWhenNoPostsExist() {
        AITripPlannerService svc = newService();

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("Sigiriya", new ArrayList<>());
        assertNotNull(resp);
        assertNotNull(resp.getExplanation());
        assertFalse(resp.getExplanation().trim().isEmpty());
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().isEmpty());
    }

    @Test
    void misspelledDistrictStillResolvesAndFiltersResults() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("n1", "Tea Estate Stay", "Views and cold weather.", "Hotel", "Nuwara Eliya"),
            post("k1", "Kandy Cafe", "Coffee.", "Restaurant", "Kandy")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("Nuware Eliya hotels", posts);

        assertNotNull(resp);
        assertNotNull(resp.getInterpretation());
        assertEquals("Nuwara Eliya", resp.getInterpretation().getDistrict());
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("n1"));
        assertFalse(resp.getMatchedPostIds().contains("k1"));
    }

    @Test
    void misspelledRomanticKeywordStillTriggersIntent() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("id-10", "Lakefront Dinner", "Candlelight dining.", "Restaurant", "Colombo"),
            post("id-11", "Couple Spa Experience", "Relaxing couple massage.", "Experience", "Colombo")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("date my girfriend", posts);

        assertNotNull(resp);
        assertNotNull(resp.getInterpretation());
        assertEquals("romantic", resp.getInterpretation().getIntent());
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("id-10"));
        assertTrue(resp.getMatchedPostIds().contains("id-11"));
    }

    @Test
    void noLocationExplanationStillMatchesInputAndOutput() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("c1", "Skyline Dinner", "Candlelight dining.", "Restaurant", "Colombo"),
            post("g1", "Beach Dinner", "Romantic dinner by the sea.", "Restaurant", "Galle"),
            post("d1", "Airport Pickup", "Transport.", "Driver", "Colombo")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("date my girlfriend", posts);

        assertNotNull(resp);
        assertNotNull(resp.getExplanation());
        String exp = resp.getExplanation().toLowerCase();

        // Input-driven
        assertTrue(exp.contains("romantic"));
        assertTrue(exp.contains("categories"));

        // Output-aligned (mentions districts from returned results)
        assertTrue(exp.contains("colombo") || exp.contains("galle"));

        // Posts shown should match the romantic categories (restaurants), not driver.
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("c1") || resp.getMatchedPostIds().contains("g1"));
    }

    @Test
    void cakeQueryUsesGeneralKnowledgeToSuggestFoodPlaces() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("r1", "Downtown Cafe", "Desserts and cakes.", "Restaurant", "Colombo"),
            post("h1", "City Hotel", "Has a restaurant and bakery.", "Hotel", "Colombo"),
            post("d1", "Taxi", "Transport.", "Driver", "Colombo")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("cake", posts);

        assertNotNull(resp);
        assertNotNull(resp.getInterpretation());
        assertEquals("food", resp.getInterpretation().getIntent());
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("restaurant"));
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("hotel"));
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("r1") || resp.getMatchedPostIds().contains("h1"));
        assertFalse(resp.getMatchedPostIds().contains("d1"));
    }

    @Test
    void birthdayQuerySuggestsRestaurantsHotelsAndExperiences() {
        AITripPlannerService svc = newService();

        List<Map<String, Object>> posts = List.of(
            post("r1", "Family Restaurant", "Party tables.", "Restaurant", "Kandy"),
            post("h1", "Resort Stay", "Birthday packages.", "Hotel", "Kandy"),
            post("e1", "Photo Shoot", "Birthday memories.", "Experience", "Kandy"),
            post("t1", "City Tour", "Tour.", "Tour Guide", "Kandy")
        );

        SmartSearchResponseDTO resp = svc.smartSearchExplainable("birthday", posts);

        assertNotNull(resp);
        assertNotNull(resp.getInterpretation());
        assertEquals("celebration", resp.getInterpretation().getIntent());
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("restaurant"));
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("hotel"));
        assertTrue(resp.getInterpretation().getSuggestedCategories().contains("experience"));
        assertNotNull(resp.getMatchedPostIds());
        assertTrue(resp.getMatchedPostIds().contains("r1"));
        assertTrue(resp.getMatchedPostIds().contains("h1"));
        assertTrue(resp.getMatchedPostIds().contains("e1"));
    }
}
