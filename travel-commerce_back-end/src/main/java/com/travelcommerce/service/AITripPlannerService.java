package com.travelcommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcommerce.dto.ServiceSummaryDTO;
import com.travelcommerce.dto.SmartSearchInterpretationDTO;
import com.travelcommerce.dto.SmartSearchResponseDTO;
import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AITripPlannerService {

    private final ServiceRepository serviceRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.provider:gemini}")
    private String provider;

    @Value("${ai.gemini.apiKey:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${ai.gemini.baseUrl:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Value("${ai.openai.apiKey:${OPENAI_API_KEY:}}")
    private String openAiApiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${ai.openai.baseUrl:https://api.openai.com}")
    private String openAiBaseUrl;

    // Enable LLM-assisted ranking for smart search (uses the same provider/token as trip planning).
    // Falls back to local heuristics if disabled, misconfigured, or if the provider call fails.
    @Value("${ai.smartSearch.useProvider:true}")
    private boolean useProviderForSmartSearch;

    // When true, use the AI provider to interpret the query into intent/categories/district when
    // local heuristics are insufficient. Outputs are validated against allowed categories/districts.
    @Value("${ai.smartSearch.useProviderForInterpretation:true}")
    private boolean useProviderForSmartSearchInterpretation;

    public AITripPlannerService(ServiceRepository serviceRepository, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.serviceRepository = serviceRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public JsonNode generateTripPlan(String userQuery, Integer numDays) {
        String trimmedQuery = userQuery == null ? "" : userQuery.trim();
        if (trimmedQuery.isEmpty()) {
            throw new IllegalArgumentException("userQuery is required");
        }

        int days = (numDays == null || numDays < 1) ? 3 : Math.min(numDays, 14);

        List<ServicePost> activeServices = serviceRepository.findByStatus("ACTIVE");
        List<ServiceSummaryDTO> summaries = new ArrayList<>();
        for (ServicePost post : activeServices) {
            ServiceSummaryDTO dto = ServiceSummaryDTO.from(post);
            if (dto != null) summaries.add(dto);
        }

        String servicesJson;
        try {
            servicesJson = objectMapper.writeValueAsString(summaries);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize services list", e);
        }

        String prompt = buildPrompt(servicesJson, trimmedQuery, days, !summaries.isEmpty());

        String rawText;
        if ("openai".equalsIgnoreCase(provider)) {
            rawText = callOpenAi(prompt);
        } else {
            rawText = callGemini(prompt);
        }

        // Build a map of serviceId -> district for validation
        Map<String, String> serviceDistrictMap = new HashMap<>();
        for (ServicePost post : activeServices) {
            if (post.getId() != null && post.getDistrict() != null) {
                serviceDistrictMap.put(post.getId(), post.getDistrict().trim().toLowerCase());
            }
        }

        String jsonArray = extractJsonArray(rawText);
        try {
            JsonNode itinerary = objectMapper.readTree(jsonArray);
            // Post-process: validate service district matches traveller's current district
            return validateServiceLocations(itinerary, serviceDistrictMap);
        } catch (Exception e) {
            throw new RuntimeException("AI response was not valid JSON array", e);
        }
    }

    /**
     * Post-processing validation: for each activity with a serviceId,
     * check that the service's actual district matches the activity's currentDistrict.
     * If mismatched, strip serviceId and serviceName.
     */
    private JsonNode validateServiceLocations(JsonNode itinerary, Map<String, String> serviceDistrictMap) {
        if (!itinerary.isArray()) return itinerary;

        com.fasterxml.jackson.databind.node.ArrayNode result = objectMapper.createArrayNode();

        for (JsonNode dayNode : itinerary) {
            com.fasterxml.jackson.databind.node.ObjectNode dayObj = dayNode.deepCopy();
            JsonNode activitiesNode = dayObj.get("activities");

            if (activitiesNode != null && activitiesNode.isArray()) {
                com.fasterxml.jackson.databind.node.ArrayNode validatedActivities = objectMapper.createArrayNode();

                for (JsonNode actNode : activitiesNode) {
                    com.fasterxml.jackson.databind.node.ObjectNode act = actNode.deepCopy();
                    String serviceId = act.has("serviceId") ? act.get("serviceId").asText("").trim() : "";
                    String currentDistrict = act.has("currentDistrict") ? act.get("currentDistrict").asText("").trim().toLowerCase() : "";

                    if (!serviceId.isEmpty() && !currentDistrict.isEmpty()) {
                        String serviceDistrict = serviceDistrictMap.getOrDefault(serviceId, "");
                        if (!serviceDistrict.isEmpty() && !serviceDistrict.equals(currentDistrict)) {
                            // District mismatch — strip the service reference
                            System.out.println("Location mismatch: service '" + serviceId + "' is in '" + serviceDistrict
                                    + "' but traveller is in '" + currentDistrict + "'. Removing service reference.");
                            act.put("serviceId", "");
                            act.put("serviceName", "");
                            // Append a helpful note
                            String note = act.has("note") ? act.get("note").asText("") : "";
                            if (!note.toLowerCase().contains("arrange")) {
                                act.put("note", note + " (No matching service available in " + currentDistrict + ")");
                            }
                        }
                    }
                    validatedActivities.add(act);
                }
                dayObj.set("activities", validatedActivities);
            }
            result.add(dayObj);
        }
        return result;
    }

    private String buildPrompt(String servicesJson, String userQuery, int numDays, boolean hasServices) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a Sri Lanka travel planning assistant for the TravelCommerce platform.\n");
        sb.append("The user wants: '").append(userQuery).append("'.\n");
        sb.append("Create a ").append(numDays).append("-day itinerary.\n\n");

        if (hasServices) {
            sb.append("Here are the available services on our platform (with id, title, category, district, pricing, description):\n");
            sb.append(servicesJson).append("\n\n");
            sb.append("RULES:\n");
            sb.append("- Use services from the list above where relevant. Reference them by their 'id' in the 'serviceId' field.\n");
            sb.append("- If no service fits a particular activity, set serviceId to empty string and write a helpful note.\n");
            sb.append("- Include the service title in the 'serviceName' field when referencing a service.\n");
            sb.append("\n*** CRITICAL LOCATION MATCHING RULES (MUST FOLLOW) ***\n");
            sb.append("Before assigning ANY service to an activity, you MUST check the service's 'district' field and verify it matches the traveller's CURRENT physical location at that moment.\n");
            sb.append("Step-by-step process for EACH activity:\n");
            sb.append("  1. Determine: Where is the traveller physically located at this time?\n");
            sb.append("  2. Only consider services whose 'district' matches that physical location.\n");
            sb.append("  3. If NO service from the correct district exists, set serviceId to empty string.\n");
            sb.append("  4. NEVER use a service from a different district just because it's the only one available.\n");
            sb.append("\nTRAVEL DAY EXAMPLE (e.g., 'Return from Galle to Colombo'):\n");
            sb.append("  - 08:00 Check-out hotel → traveller is STILL IN GALLE → use only Galle services\n");
            sb.append("  - 09:00 Drive to Colombo → traveller is DEPARTING FROM GALLE → use only Galle-district drivers (NOT Colombo drivers)\n");
            sb.append("  - 12:00 Arrive Colombo, lunch → traveller is NOW IN COLOMBO → use Colombo services from this point onward\n");
            sb.append("  - 14:00 Explore Colombo → use Colombo services\n");
            sb.append("\nKey principle: A driver/transport service picks you up WHERE YOU ARE, not where you're going. ");
            sb.append("If the traveller is in Galle and needs to go to Colombo, they need a GALLE-based driver, not a Colombo-based one.\n");
            sb.append("If no driver exists in the departure district, set serviceId to empty string and write 'Arrange local transport from [departure] to [destination]'.\n");
        } else {
            sb.append("NOTE: There are currently no listed services on the platform.\n");
            sb.append("- Create a general Sri Lanka travel itinerary based on popular destinations.\n");
            sb.append("- Set serviceId and serviceName to empty strings for all activities.\n");
            sb.append("- Write detailed notes with place names, tips, and suggestions.\n");
        }

        sb.append("\nReturn ONLY a raw JSON array (no markdown, no explanation) with this exact structure:\n");
        sb.append("[{ \"day\": 1, \"title\": \"Day title\", \"activities\": [{ \"time\": \"09:00\", \"currentDistrict\": \"The district where the traveller physically is at this moment\", \"serviceId\": \"...\", \"serviceName\": \"...\", \"note\": \"Description of the activity\", \"category\": \"Hotel|Tour Guide|Restaurant|Experience|Driver\" }] }]\n");
        sb.append("The 'currentDistrict' field is MANDATORY for every activity. It must be the Sri Lankan district where the traveller is physically located at that time (e.g. 'Galle', 'Colombo', 'Kandy').\n");
        sb.append("Make sure each day has 3-6 activities with realistic times. Include meals, transport, and sightseeing.\n");
        sb.append("FINAL CHECK: Before outputting, review EVERY activity where you assigned a serviceId. Verify that service's district matches the currentDistrict. If it doesn't match, remove the serviceId and serviceName.");

        return sb.toString();
    }

    private String callGemini(String prompt) {
        String apiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("Missing Gemini API key. Set GEMINI_API_KEY or ai.gemini.apiKey");
        }

        String url = geminiBaseUrl + "/v1/models/" + geminiModel + ":generateContent?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, Objects.requireNonNull(HttpMethod.POST), entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini API call failed: " + response.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
            if (textNode.isMissingNode() || textNode.isNull()) {
                throw new RuntimeException("Gemini response missing text");
            }
            return textNode.asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private String callOpenAi(String prompt) {
        String apiKey = openAiApiKey == null ? "" : openAiApiKey.trim();
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("Missing OpenAI API key. Set OPENAI_API_KEY or ai.openai.apiKey");
        }

        String url = openAiBaseUrl + "/v1/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", openAiModel);
        body.put("temperature", 0.2);
        body.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, Objects.requireNonNull(HttpMethod.POST), entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("OpenAI API call failed: " + response.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.at("/choices/0/message/content");
            if (textNode.isMissingNode() || textNode.isNull()) {
                throw new RuntimeException("OpenAI response missing content");
            }
            return textNode.asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }

    /**
     * Attempts to extract a JSON array from AI text output.
     * Accepts raw JSON or JSON wrapped in ``` fences.
     */
    private String extractJsonArray(String text) {
        if (text == null) {
            throw new RuntimeException("Empty AI response");
        }

        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            // remove leading fence line
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            // remove trailing fence
            int lastFence = cleaned.lastIndexOf("```");
            if (lastFence >= 0) {
                cleaned = cleaned.substring(0, lastFence);
            }
            cleaned = cleaned.trim();
        }

        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start < 0 || end < 0 || end <= start) {
            throw new RuntimeException("Could not locate JSON array in AI response");
        }

        return cleaned.substring(start, end + 1).trim();
    }

    public List<Long> smartSearch(String searchQuery, List<Map<String, Object>> availablePosts) {
        String trimmedQuery = searchQuery == null ? "" : searchQuery.trim();
        if (trimmedQuery.isEmpty() || availablePosts == null || availablePosts.isEmpty()) {
            System.out.println("Smart search - empty query or no posts available");
            return new ArrayList<>();
        }

        // Extract explicit constraints from the query
        String requiredDistrict = detectDistrict(trimmedQuery.toLowerCase());
        String requiredCategory = detectCategory(trimmedQuery.toLowerCase());
        System.out.println("Smart search - Query: '" + trimmedQuery + "'");
        System.out.println("Smart search - Detected district: '" + requiredDistrict + "'");
        System.out.println("Smart search - Detected category: '" + requiredCategory + "'");

        String postsJson;
        try {
            postsJson = objectMapper.writeValueAsString(availablePosts);
            System.out.println("Smart search - Posts JSON length: " + postsJson.length());
        } catch (Exception e) {
            System.err.println("Failed to serialize posts: " + e.getMessage());
            throw new RuntimeException("Failed to serialize posts list", e);
        }

        String prompt = buildSmartSearchPrompt(postsJson, trimmedQuery);
        System.out.println("Smart search - Calling AI with prompt length: " + prompt.length());

        String rawText;
        try {
            if ("openai".equalsIgnoreCase(provider)) {
                rawText = callOpenAi(prompt);
            } else {
                rawText = callGemini(prompt);
            }
            System.out.println("Smart search - AI response: " + rawText);
        } catch (Exception e) {
            System.err.println("AI call failed: " + e.getMessage());
            throw new RuntimeException("AI service call failed", e);
        }

        try {
            // Extract JSON array of IDs
            String jsonArray = extractJsonArray(rawText);
            System.out.println("Smart search - Extracted JSON: " + jsonArray);
            
            JsonNode node = objectMapper.readTree(jsonArray);
            List<Long> matchedIds = new ArrayList<>();
            if (node.isArray()) {
                for (JsonNode idNode : node) {
                    if (idNode.isNumber()) {
                        matchedIds.add(idNode.asLong());
                    } else if (idNode.isTextual()) {
                        try {
                            matchedIds.add(Long.parseLong(idNode.asText().trim()));
                        } catch (NumberFormatException ignore) {
                        }
                    }
                }
            }
            List<Long> constrained = applyConstraints(matchedIds, availablePosts, requiredDistrict, requiredCategory);
            System.out.println("Smart search - Final matched IDs after constraints: " + constrained);
            return constrained;
        } catch (Exception e) {
            System.err.println("Failed to parse AI response: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("AI response was not valid JSON array of IDs", e);
        }
    }

    // Heuristic: detect district from query text by substring match
    private String detectDistrict(String queryLower) {
        String[] districts = {
                "colombo","gampaha","kalutara","kandy","matale","nuwara eliya","galle","matara","hambantota",
                "jaffna","kilinochchi","mannar","vavuniya","mullaitivu","batticaloa","ampara","trincomalee",
                "kurunegala","puttalam","anuradhapura","polonnaruwa","badulla","monaragala","ratnapura","kegalle"
        };
        for (String d : districts) {
            if (queryLower.contains(d)) return d;
        }
        return "";
    }

    // Heuristic: detect category from query (returns normalized snake_case key)
    private String detectCategory(String queryLower) {
        if (queryLower.contains("restaurant") || queryLower.contains("restuarent") || queryLower.contains("restraurent")
                || queryLower.contains("food") || queryLower.contains("dine") || queryLower.contains("coffee")
                || queryLower.contains("coffie") || queryLower.contains("cafe")) {
            return "restaurant";
        }
        if (queryLower.contains("hotel") || queryLower.contains("stay") || queryLower.contains("resort")
                || queryLower.contains("room") || queryLower.contains("accommodation") || queryLower.contains("accomodation")) {
            return "hotel";
        }
        if (queryLower.contains("driver") || queryLower.contains("taxi") || queryLower.contains("cab")
                || queryLower.contains("transport") || queryLower.contains("van") || queryLower.contains("pickup")
                || queryLower.contains("ride")) {
            return "driver";
        }
        if (queryLower.contains("guide") || queryLower.contains("tour") || queryLower.contains("excursion")
                || queryLower.contains("sightseeing") || queryLower.contains("sight seeing")) {
            return "tour_guide";
        }
        if (queryLower.contains("experience") || queryLower.contains("workshop") || queryLower.contains("activity")
                || queryLower.contains("class") || queryLower.contains("lesson")) {
            return "experience";
        }
        return "";
    }

    /**
     * Enforce detected constraints on AI-returned IDs using the availablePosts payload.
     * Uses case-insensitive district matching and normalized category keys.
     */
    private List<Long> applyConstraints(List<Long> aiIds, List<Map<String, Object>> posts,
                                       String requiredDistrict, String requiredCategory) {
        System.out.println("applyConstraints - AI returned " + aiIds.size() + " IDs: " + aiIds);
        System.out.println("applyConstraints - Required district: '" + requiredDistrict + "', Required category: '" + requiredCategory + "'");
        
        if ((requiredDistrict.isEmpty() && requiredCategory.isEmpty()) || aiIds.isEmpty()) {
            System.out.println("applyConstraints - No constraints to enforce or no IDs, returning all AI results");
            return aiIds; // nothing to enforce
        }

        // Build a lookup of id -> (district, category) with normalization
        Map<Long, Map<String, String>> lookup = new HashMap<>();
        for (Map<String, Object> p : posts) {
            Long id = parseId(p.get("id"));
            if (id == null) continue;
            String district = p.get("district") != null ? p.get("district").toString().trim().toLowerCase() : "";
            String category = p.get("category") != null ? normalizeCategory(p.get("category").toString()) : "";
            lookup.put(id, Map.of("district", district, "category", category));
        }

        List<Long> filtered = new ArrayList<>();
        for (Long id : aiIds) {
            Map<String, String> meta = lookup.get(id);
            if (meta == null) {
                System.out.println("applyConstraints - ID " + id + ": NOT FOUND in posts, skipping");
                continue;
            }
            
            String serviceDistrict = meta.get("district");
            String serviceCategory = meta.get("category");
            
            boolean districtMatch = requiredDistrict.isEmpty() || serviceDistrict.equals(requiredDistrict);
            boolean categoryMatch = requiredCategory.isEmpty() || serviceCategory.equals(requiredCategory);
            
            System.out.println("applyConstraints - ID " + id + ": district='" + serviceDistrict + "' (match=" + districtMatch + 
                             "), category='" + serviceCategory + "' (match=" + categoryMatch + ")");
            
            if (!districtMatch || !categoryMatch) {
                System.out.println("applyConstraints - ID " + id + ": FILTERED OUT");
                continue;
            }
            
            filtered.add(id);
            System.out.println("applyConstraints - ID " + id + ": KEPT");
        }
        
        System.out.println("applyConstraints - Final filtered count: " + filtered.size());
        return filtered;
    }

    /**
     * Normalize category name to snake_case key format (e.g., "Tour Guide" -> "tour_guide").
     */
    private String normalizeCategory(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "";
        String normalized = raw.trim().toLowerCase().replace(" ", "_");
        System.out.println("normalizeCategory: '" + raw + "' -> '" + normalized + "'");
        return normalized;
    }

    private Long parseId(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number) return ((Number) raw).longValue();
        try {
            return Long.parseLong(raw.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String buildSmartSearchPrompt(String postsJson, String searchQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a semantic search assistant for the TravelCommerce platform.\n\n");
        sb.append("User's search query: \"").append(searchQuery).append("\"\n\n");
        sb.append("Available services (JSON array with id, title, description, category, district, location, etc.):\n");
        sb.append(postsJson).append("\n\n");
        sb.append("TASK: Analyze the query semantically and return service IDs that might match the user's intent.\n");
        sb.append("Consider:\n");
        sb.append("- Location/District: If mentioned, prioritize services in that location\n");
        sb.append("- Category: restaurant, hotel, driver, tour guide, experience\n");
        sb.append("- Keywords in title and description\n");
        sb.append("- Synonyms: 'coffee/cafe' relates to restaurant, 'stay/accommodation' to hotel, 'taxi/transport' to driver, etc.\n\n");
        sb.append("Return a JSON array of service IDs that could match, ordered by relevance.\n");
        sb.append("Format: [15, 23, 8] or [] if no matches.\n");
        sb.append("Output ONLY the JSON array, nothing else.");
        return sb.toString();
    }

    /**
     * Explainable smart-search.
     *
     * Always returns an explanation of how the query was understood,
     * even if no services match (or if there are zero services on the platform).
     */
    public SmartSearchResponseDTO smartSearchExplainable(String searchQuery, List<Map<String, Object>> availablePosts) {
        String trimmedQuery = searchQuery == null ? "" : searchQuery.trim();
        QueryInterpretation interpretation = interpretQuery(trimmedQuery);

        List<String> matchedIds = rankPostsExplainable(trimmedQuery, interpretation, availablePosts);
        String explanation = buildExplainableSearchExplanation(trimmedQuery, interpretation, availablePosts, matchedIds);

        SmartSearchInterpretationDTO interpretationDTO = new SmartSearchInterpretationDTO(
                trimmedQuery,
                interpretation.intent,
                interpretation.place,
                interpretation.district,
                interpretation.nearbyDistricts,
                interpretation.suggestedCategories,
                interpretation.strategy
        );

        return new SmartSearchResponseDTO(explanation, interpretationDTO, matchedIds);
    }

    private static class QueryInterpretation {
        String intent = "general";
        String place = "";
        String district = "";
        String districtKey = "";
        List<String> nearbyDistricts = new ArrayList<>();
        List<String> nearbyDistrictKeys = new ArrayList<>();
        List<String> suggestedCategories = new ArrayList<>();
        String strategy = "none";
    }

    private QueryInterpretation interpretQuery(String query) {
        QueryInterpretation interpretation = new QueryInterpretation();
        if (query == null || query.trim().isEmpty()) {
            interpretation.intent = "general";
            interpretation.strategy = "none";
            return interpretation;
        }

        // Always interpret in a case-insensitive way and apply lightweight spelling normalization.
        // This is intentionally conservative: we correct common travel/search typos and rely on the AI provider
        // for deeper language understanding.
        String qLower = normalizeQueryLower(query);

        // 1) Detect explicit district mention
        String detectedDistrict = detectDistrict(qLower);
        if (detectedDistrict.isEmpty()) {
            detectedDistrict = detectDistrictFuzzy(qLower);
        }
        if (!detectedDistrict.isEmpty()) {
            interpretation.district = toDistrictDisplayName(detectedDistrict);
            interpretation.districtKey = normalizeDistrictKey(interpretation.district);
        }

        // 2) Detect well-known place -> district mapping (small knowledge base)
        PlaceResolution placeResolution = resolvePlaceToDistrict(qLower);
        if (placeResolution != null) {
            if (!placeResolution.place.isEmpty()) {
                interpretation.place = placeResolution.place;
            }
            if (interpretation.district.isEmpty() && !placeResolution.district.isEmpty()) {
                interpretation.district = placeResolution.district;
                interpretation.districtKey = normalizeDistrictKey(interpretation.district);
            }
        }

        // 3) Detect intent & category suggestions
        IntentResolution intentResolution = resolveIntentAndCategories(qLower);
        interpretation.intent = intentResolution.intent;
        interpretation.suggestedCategories = intentResolution.categories;

        // 3b) If heuristics didn't extract much (no district + no categories), use the provider to interpret.
        // This helps cover broad "common sense" queries without adding lots of one-off rules.
        boolean hasAnyHeuristicSignal = (!interpretation.districtKey.isEmpty())
                || (interpretation.suggestedCategories != null && !interpretation.suggestedCategories.isEmpty())
                || (interpretation.place != null && !interpretation.place.trim().isEmpty());
        if (!hasAnyHeuristicSignal) {
            ProviderInterpretation pi = tryInterpretWithProvider(query);
            if (pi != null) {
                if (pi.intent != null && !pi.intent.trim().isEmpty()) {
                    interpretation.intent = pi.intent.trim();
                }
                if (pi.place != null && !pi.place.trim().isEmpty()) {
                    interpretation.place = pi.place.trim();
                }
                if (pi.district != null && !pi.district.trim().isEmpty()) {
                    interpretation.district = pi.district.trim();
                    interpretation.districtKey = normalizeDistrictKey(interpretation.district);
                }
                if (pi.categories != null && !pi.categories.isEmpty()) {
                    interpretation.suggestedCategories = pi.categories;
                }
            }
        }

        // 4) Nearby districts (only if we have a district)
        if (!interpretation.district.isEmpty()) {
            interpretation.nearbyDistricts = resolveNearbyDistricts(interpretation.district);
            List<String> keys = new ArrayList<>();
            for (String nd : interpretation.nearbyDistricts) {
                String key = normalizeDistrictKey(nd);
                if (!key.isEmpty()) keys.add(key);
            }
            interpretation.nearbyDistrictKeys = keys;
        }

        return interpretation;
    }

    private static class ProviderInterpretation {
        final String intent;
        final String place;
        final String district;
        final List<String> categories;

        private ProviderInterpretation(String intent, String place, String district, List<String> categories) {
            this.intent = intent;
            this.place = place;
            this.district = district;
            this.categories = categories;
        }
    }

    private ProviderInterpretation tryInterpretWithProvider(String query) {
        if (!useProviderForSmartSearchInterpretation) return null;
        if (!useProviderForSmartSearch) return null;
        if (restTemplate == null || objectMapper == null) return null;

        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) return null;

        boolean hasAnyKey = (openAiApiKey != null && !openAiApiKey.trim().isEmpty())
                || (geminiApiKey != null && !geminiApiKey.trim().isEmpty());
        if (!hasAnyKey) return null;

        String prompt = buildAiInterpretationPrompt(trimmed);
        String raw;
        try {
            if ("openai".equalsIgnoreCase(provider)) {
                raw = callOpenAi(prompt);
            } else {
                raw = callGemini(prompt);
            }
        } catch (Exception e) {
            return null;
        }

        try {
            String jsonObj = extractJsonObject(raw);
            JsonNode node = objectMapper.readTree(jsonObj);
            if (node == null || !node.isObject()) return null;

            String intent = node.has("intent") ? node.get("intent").asText("") : "";
            String place = node.has("place") ? node.get("place").asText("") : "";
            String district = node.has("district") ? node.get("district").asText("") : "";

            List<String> categories = new ArrayList<>();
            JsonNode cats = node.get("categories");
            if (cats != null && cats.isArray()) {
                for (JsonNode c : cats) {
                    if (c == null || c.isNull()) continue;
                    String cc = c.asText("").trim().toLowerCase(Locale.ROOT);
                    if (!cc.isEmpty()) categories.add(cc);
                }
            }

            // Validate against allowed values
            intent = sanitizeIntent(intent);
            categories = sanitizeCategories(categories);
            district = sanitizeDistrict(district);

            if ((intent == null || intent.isEmpty())
                    && (place == null || place.trim().isEmpty())
                    && (district == null || district.isEmpty())
                    && (categories == null || categories.isEmpty())) {
                return null;
            }

            return new ProviderInterpretation(intent, place, district, categories);
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitizeIntent(String raw) {
        if (raw == null) return "";
        String i = raw.trim().toLowerCase(Locale.ROOT);
        if (i.isEmpty()) return "";
        Set<String> allowed = Set.of(
                "general", "food", "stay", "transport", "sightseeing", "experience",
                "romantic", "family", "adventure", "budget", "amenities", "celebration"
        );
        return allowed.contains(i) ? i : "general";
    }

    private List<String> sanitizeCategories(List<String> raw) {
        if (raw == null || raw.isEmpty()) return new ArrayList<>();
        Set<String> allowed = Set.of("restaurant", "hotel", "driver", "tour_guide", "experience");
        List<String> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String c : raw) {
            if (c == null) continue;
            String cc = c.trim().toLowerCase(Locale.ROOT);
            if (cc.isEmpty()) continue;
            if (!allowed.contains(cc)) continue;
            if (seen.add(cc)) out.add(cc);
            if (out.size() >= 4) break;
        }
        return out;
    }

    private String sanitizeDistrict(String raw) {
        if (raw == null) return "";
        String d = raw.trim();
        if (d.isEmpty()) return "";

        // Accept either display form (e.g., "Kandy") or lower-case ("kandy").
        String key = normalizeDistrictKey(d);
        if (key.isEmpty()) return "";

        // If it matches a known district key, return display name.
        String detected = detectDistrict(key);
        if (detected != null && !detected.isEmpty()) return toDistrictDisplayName(detected);

        // As a fallback, allow fuzzy district correction.
        String fuzzy = detectDistrictFuzzy(key);
        if (fuzzy != null && !fuzzy.isEmpty()) return toDistrictDisplayName(fuzzy);
        return "";
    }

    private String buildAiInterpretationPrompt(String query) {
        // Force a constrained JSON output to prevent free-form text.
        StringBuilder sb = new StringBuilder();
        sb.append("You interpret a travel/search query for a Sri Lanka travel commerce platform.\n");
        sb.append("Infer intent and suitable service categories using general knowledge.\n");
        sb.append("Do NOT do keyword matching. Do NOT mention services.\n\n");
        sb.append("User query: \"").append(query).append("\"\n\n");
        sb.append("Return ONLY a single raw JSON object with this schema (no markdown):\n");
        sb.append("{\n");
        sb.append("  \"intent\": one of [general, food, stay, transport, sightseeing, experience, romantic, family, adventure, budget, amenities, celebration],\n");
        sb.append("  \"categories\": array with any of [restaurant, hotel, driver, tour_guide, experience],\n");
        sb.append("  \"place\": string (optional),\n");
        sb.append("  \"district\": string (optional; use Sri Lanka district name if user implied a location)\n");
        sb.append("}\n");
        sb.append("Rules:\n");
        sb.append("- If the query is about food/desserts (e.g., cake), categories should include restaurant and/or hotel.\n");
        sb.append("- If the query is about birthdays/celebrations, categories should include restaurant and/or hotel and/or experience.\n");
        sb.append("- If no clear intent, use intent=general and categories=[].\n");
        return sb.toString();
    }

    private String extractJsonObject(String text) {
        if (text == null) throw new RuntimeException("Empty AI response");
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) cleaned = cleaned.substring(firstNewline + 1);
            int lastFence = cleaned.lastIndexOf("```");
            if (lastFence >= 0) cleaned = cleaned.substring(0, lastFence);
            cleaned = cleaned.trim();
        }

        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) {
            throw new RuntimeException("Could not locate JSON object in AI response");
        }
        return cleaned.substring(start, end + 1).trim();
    }

    private static class PlaceResolution {
        final String place;
        final String district;

        private PlaceResolution(String place, String district) {
            this.place = place;
            this.district = district;
        }
    }

    private PlaceResolution resolvePlaceToDistrict(String queryLower) {
        // Minimal curated knowledge for common Sri Lanka travel queries.
        // District names here are display-case.
        Map<String, String> placeToDistrict = new LinkedHashMap<>();
        placeToDistrict.put("sigiriya", "Matale");
        placeToDistrict.put("dambulla", "Matale");
        placeToDistrict.put("minneriya", "Polonnaruwa");
        placeToDistrict.put("polonnaruwa", "Polonnaruwa");
        placeToDistrict.put("anuradhapura", "Anuradhapura");
        placeToDistrict.put("kandy", "Kandy");
        placeToDistrict.put("nuwara eliya", "Nuwara Eliya");
        placeToDistrict.put("ella", "Badulla");
        placeToDistrict.put("badulla", "Badulla");
        placeToDistrict.put("galle fort", "Galle");
        placeToDistrict.put("galle", "Galle");
        placeToDistrict.put("mirissa", "Matara");
        placeToDistrict.put("unawatuna", "Galle");
        placeToDistrict.put("hikkaduwa", "Galle");
        placeToDistrict.put("bentota", "Kalutara");
        placeToDistrict.put("colombo", "Colombo");
        placeToDistrict.put("negombo", "Gampaha");
        placeToDistrict.put("trincomalee", "Trincomalee");
        placeToDistrict.put("arugam bay", "Ampara");
        placeToDistrict.put("yala", "Hambantota");
        placeToDistrict.put("katunayake", "Gampaha");
        placeToDistrict.put("bandaranaike", "Gampaha");

        // Common misspellings / variants
        placeToDistrict.put("sigirya", "Matale");
        placeToDistrict.put("sigirya rock", "Matale");
        placeToDistrict.put("nuwera eliya", "Nuwara Eliya");
        placeToDistrict.put("nuwaraeliya", "Nuwara Eliya");

        for (Map.Entry<String, String> e : placeToDistrict.entrySet()) {
            if (queryLower.contains(e.getKey())) {
                return new PlaceResolution(toTitleLike(e.getKey()), e.getValue());
            }
        }
        return null;
    }

    private static class IntentResolution {
        final String intent;
        final List<String> categories;

        private IntentResolution(String intent, List<String> categories) {
            this.intent = intent;
            this.categories = categories;
        }
    }

    private IntentResolution resolveIntentAndCategories(String queryLower) {
        // Category-first detection (existing heuristics) + intent layer
        String category = detectCategory(queryLower);
        if (!category.isEmpty()) {
            String intent = switch (category) {
                case "restaurant" -> "food";
                case "hotel" -> "stay";
                case "driver" -> "transport";
                case "tour_guide" -> "sightseeing";
                case "experience" -> "experience";
                default -> "general";
            };
            return new IntentResolution(intent, List.of(category));
        }

        // General knowledge: food/dessert searches usually map to restaurants (and sometimes hotels).
        // Example: "cake" -> places to eat/buy/order desserts.
        if (queryLower.contains("cake") || queryLower.contains("dessert") || queryLower.contains("bakery")
                || queryLower.contains("pastry") || queryLower.contains("sweet") || queryLower.contains("ice cream")
                || queryLower.contains("chocolate") || queryLower.contains("cupcake") || queryLower.contains("cup cake")) {
            return new IntentResolution("food", List.of("restaurant", "hotel"));
        }

        // General knowledge: celebrations (birthday/party) typically map to restaurants + hotels + experiences.
        if (queryLower.contains("birthday") || queryLower.contains("bday") || queryLower.contains("party")
                || queryLower.contains("celebration") || queryLower.contains("celebrate") || queryLower.contains("surprise")
                || queryLower.contains("anniversary")) {
            return new IntentResolution("celebration", List.of("restaurant", "hotel", "experience"));
        }

        // Amenities / facilities intent
        if (queryLower.contains("toilet") || queryLower.contains("restroom") || queryLower.contains("washroom")
                || queryLower.contains("bathroom") || queryLower.contains("wc")) {
            // In travel contexts, hotels/restaurants are common places users look for facilities.
            return new IntentResolution("amenities", List.of("hotel", "restaurant"));
        }

        // Intent keywords
        if (queryLower.contains("date") || queryLower.contains("girlfriend") || queryLower.contains("boyfriend")
                || queryLower.contains("wife") || queryLower.contains("husband") || queryLower.contains("romantic")
                || queryLower.contains("anniversary") || queryLower.contains("proposal") || queryLower.contains("honeymoon")) {
            return new IntentResolution("romantic", List.of("hotel", "restaurant", "experience"));
        }

        // Common misspellings for romantic intent keywords
        if (queryLower.contains("girfriend") || queryLower.contains("girlfrnd") || queryLower.contains("boyfreind")
                || queryLower.contains("romantc") || queryLower.contains("romntic") || queryLower.contains("honeymon")) {
            return new IntentResolution("romantic", List.of("hotel", "restaurant", "experience"));
        }

        if (queryLower.contains("family") || queryLower.contains("kids") || queryLower.contains("children")
                || queryLower.contains("child") || queryLower.contains("baby")) {
            return new IntentResolution("family", List.of("hotel", "restaurant", "experience"));
        }

        if (queryLower.contains("adventure") || queryLower.contains("hike") || queryLower.contains("trek")
                || queryLower.contains("surf") || queryLower.contains("diving") || queryLower.contains("rafting")
                || queryLower.contains("safari")) {
            return new IntentResolution("adventure", List.of("experience", "tour_guide", "driver"));
        }

        if (queryLower.contains("cheap") || queryLower.contains("budget") || queryLower.contains("low price")
                || queryLower.contains("affordable")) {
            return new IntentResolution("budget", List.of("hotel", "restaurant", "driver"));
        }

        return new IntentResolution("general", new ArrayList<>());
    }

    private String normalizeQueryLower(String query) {
        if (query == null) return "";
        String q = query.toLowerCase(Locale.ROOT);

        // Normalize punctuation to spaces
        q = q.replaceAll("[^a-z0-9\\s]", " ");
        q = q.replaceAll("\\s+", " ").trim();

        // Common search typos (keep minimal and safe)
        Map<String, String> replacements = new LinkedHashMap<>();
        replacements.put("restuarent", "restaurant");
        replacements.put("restraurent", "restaurant");
        replacements.put("restuarant", "restaurant");
        replacements.put("resturent", "restaurant");
        replacements.put("resturants", "restaurant");
        replacements.put("resturants", "restaurant");
        replacements.put("restorant", "restaurant");
        replacements.put("coffie", "coffee");
        replacements.put("accomodation", "accommodation");
        replacements.put("accomodation", "accommodation");
        replacements.put("hotal", "hotel");
        replacements.put("hotell", "hotel");
        replacements.put("nuware eliya", "nuwara eliya");
        replacements.put("nuwera eliya", "nuwara eliya");
        replacements.put("anuradapura", "anuradhapura");
        replacements.put("polanaruwa", "polonnaruwa");
        replacements.put("sigirya", "sigiriya");
        replacements.put("sigirya rock", "sigiriya");
        replacements.put("girfriend", "girlfriend");
        replacements.put("boyfreind", "boyfriend");

        for (Map.Entry<String, String> e : replacements.entrySet()) {
            if (q.contains(e.getKey())) {
                q = q.replace(e.getKey(), e.getValue());
            }
        }

        q = q.replaceAll("\\s+", " ").trim();
        return q;
    }

    private String detectDistrictFuzzy(String queryLower) {
        if (queryLower == null || queryLower.trim().isEmpty()) return "";

        // Use the same base list as detectDistrict(), but apply a small edit-distance match.
        String[] districts = {
                "colombo","gampaha","kalutara","kandy","matale","nuwara eliya","galle","matara","hambantota",
                "jaffna","kilinochchi","mannar","vavuniya","mullaitivu","batticaloa","ampara","trincomalee",
                "kurunegala","puttalam","anuradhapura","polonnaruwa","badulla","monaragala","ratnapura","kegalle"
        };

        String cleaned = queryLower.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) return "";

        String[] tokens = cleaned.split("\\s+");

        // For single-word districts, compare to each token.
        for (String d : districts) {
            if (d.contains(" ")) continue;
            for (String t : tokens) {
                if (t.length() < 4) continue;
                int dist = levenshteinDistance(t, d, 2);
                if (dist >= 0 && dist <= 2) return d;
            }
        }

        // For multi-word districts, compare to n-grams of the same length.
        for (String d : districts) {
            if (!d.contains(" ")) continue;
            String[] dParts = d.split("\\s+");
            int n = dParts.length;
            if (tokens.length < n) continue;
            for (int i = 0; i <= tokens.length - n; i++) {
                StringBuilder sb = new StringBuilder();
                for (int j = 0; j < n; j++) {
                    if (j > 0) sb.append(' ');
                    sb.append(tokens[i + j]);
                }
                String gram = sb.toString();
                int dist = levenshteinDistance(gram, d, 2);
                if (dist >= 0 && dist <= 2) return d;
            }
        }

        return "";
    }

    /**
     * Levenshtein distance with max threshold: returns -1 if distance exceeds max.
     */
    private int levenshteinDistance(String a, String b, int max) {
        if (a == null || b == null) return -1;
        if (a.equals(b)) return 0;
        if (max < 0) return -1;

        int la = a.length();
        int lb = b.length();
        if (Math.abs(la - lb) > max) return -1;

        int[] prev = new int[lb + 1];
        int[] curr = new int[lb + 1];

        for (int j = 0; j <= lb; j++) prev[j] = j;

        for (int i = 1; i <= la; i++) {
            curr[0] = i;
            int bestInRow = curr[0];
            char ca = a.charAt(i - 1);

            for (int j = 1; j <= lb; j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                int v = Math.min(
                        Math.min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost
                );
                curr[j] = v;
                if (v < bestInRow) bestInRow = v;
            }

            if (bestInRow > max) return -1;

            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }

        return prev[lb] <= max ? prev[lb] : -1;
    }

    private List<String> resolveNearbyDistricts(String districtDisplay) {
        // Coarse nearby grouping as a reasonable fallback.
        String d = (districtDisplay == null ? "" : districtDisplay.trim());
        if (d.isEmpty()) return new ArrayList<>();

        Map<String, List<String>> groups = new HashMap<>();
        groups.put("Colombo", List.of("Gampaha", "Kalutara"));
        groups.put("Gampaha", List.of("Colombo", "Kalutara", "Puttalam"));
        groups.put("Kalutara", List.of("Colombo", "Gampaha", "Galle"));
        groups.put("Galle", List.of("Matara", "Kalutara"));
        groups.put("Matara", List.of("Galle", "Hambantota"));
        groups.put("Hambantota", List.of("Matara", "Monaragala"));

        groups.put("Kandy", List.of("Matale", "Nuwara Eliya", "Kegalle"));
        groups.put("Matale", List.of("Kandy", "Kurunegala", "Anuradhapura", "Polonnaruwa"));
        groups.put("Nuwara Eliya", List.of("Kandy", "Badulla", "Kegalle"));
        groups.put("Badulla", List.of("Nuwara Eliya", "Monaragala", "Kandy"));
        groups.put("Monaragala", List.of("Badulla", "Hambantota", "Ampara"));

        groups.put("Anuradhapura", List.of("Kurunegala", "Puttalam", "Polonnaruwa", "Matale"));
        groups.put("Polonnaruwa", List.of("Anuradhapura", "Matale", "Trincomalee", "Batticaloa"));
        groups.put("Kurunegala", List.of("Puttalam", "Kegalle", "Matale", "Anuradhapura"));
        groups.put("Puttalam", List.of("Kurunegala", "Gampaha", "Anuradhapura"));
        groups.put("Kegalle", List.of("Kandy", "Kurunegala", "Ratnapura", "Nuwara Eliya"));
        groups.put("Ratnapura", List.of("Kegalle", "Kalutara", "Galle"));

        groups.put("Trincomalee", List.of("Polonnaruwa", "Batticaloa", "Anuradhapura"));
        groups.put("Batticaloa", List.of("Ampara", "Polonnaruwa", "Trincomalee"));
        groups.put("Ampara", List.of("Batticaloa", "Monaragala"));

        List<String> nearby = new ArrayList<>(groups.getOrDefault(d, List.of()));
        nearby.removeIf(x -> x.equalsIgnoreCase(d));
        return nearby;
    }

    private List<String> rankPostsExplainable(String originalQuery, QueryInterpretation interpretation,
                                             List<Map<String, Object>> availablePosts) {
        if (availablePosts == null || availablePosts.isEmpty()) {
            interpretation.strategy = "none";
            return new ArrayList<>();
        }

        // 0) If enabled and configured, try LLM-assisted ranking first.
        // We still enforce constraints (district/category) and validate IDs against availablePosts.
        List<String> aiRanked = tryRankPostsWithProvider(originalQuery, interpretation, availablePosts);
        if (aiRanked != null && !aiRanked.isEmpty()) {
            // Strategy is set inside constraint application when possible.
            return aiRanked;
        }

        // Normalize constraints for matching
        String requiredDistrictKey = interpretation.districtKey == null ? "" : interpretation.districtKey;
        Set<String> nearbyKeys = new HashSet<>();
        if (interpretation.nearbyDistrictKeys != null) {
            for (String ndKey : interpretation.nearbyDistrictKeys) {
                if (ndKey != null && !ndKey.trim().isEmpty()) nearbyKeys.add(ndKey.trim());
            }
        }
        Set<String> preferredCategories = new HashSet<>();
        for (String c : interpretation.suggestedCategories) {
            if (c != null && !c.trim().isEmpty()) preferredCategories.add(c.trim().toLowerCase(Locale.ROOT));
        }

        boolean hasDistrict = !requiredDistrictKey.isEmpty();
        boolean hasPreferredCategories = !preferredCategories.isEmpty();

        // Helper: stable ordering based on semantic preference only (district/category), not keyword overlap.
        // We avoid matching on title/description tokens to prevent the search from degenerating into keyword search.
        java.util.function.ToIntFunction<Map<String, Object>> categoryPreferenceScore = (p) -> {
            if (!hasPreferredCategories) return 0;
            String category = p.get("category") != null ? normalizeCategory(p.get("category").toString()) : "";
            return preferredCategories.contains(category) ? 100 : 0;
        };

        // If the query specifies a district, keep results inside that district.
        // Only broaden to nearby districts if there are zero posts in the requested district.
        if (hasDistrict) {
            List<ScoredId> exactPreferred = new ArrayList<>();
            List<ScoredId> exactAll = new ArrayList<>();
            for (Map<String, Object> p : availablePosts) {
                String id = parseIdString(p.get("id"));
                if (id.isEmpty()) continue;

                String district = normalizeDistrictKey(p.get("district") != null ? p.get("district").toString() : "");
                if (!district.equals(requiredDistrictKey)) continue;

                int score = 100 + categoryPreferenceScore.applyAsInt(p);
                exactAll.add(new ScoredId(id, score));
                if (hasPreferredCategories && categoryPreferenceScore.applyAsInt(p) > 0) {
                    exactPreferred.add(new ScoredId(id, score));
                }
            }

            // If intent suggested categories, prefer returning only those categories in the district.
            exactPreferred.sort((a, b) -> Integer.compare(b.score, a.score));
            if (!exactPreferred.isEmpty()) {
                interpretation.strategy = "district";
                List<String> ids = new ArrayList<>();
                for (int i = 0; i < exactPreferred.size() && i < 30; i++) ids.add(exactPreferred.get(i).id);
                return ids;
            }

            // Otherwise return anything in the requested district.
            exactAll.sort((a, b) -> Integer.compare(b.score, a.score));
            if (!exactAll.isEmpty()) {
                interpretation.strategy = "district";
                List<String> ids = new ArrayList<>();
                for (int i = 0; i < exactAll.size() && i < 30; i++) ids.add(exactAll.get(i).id);
                return ids;
            }

            if (!nearbyKeys.isEmpty()) {
                List<ScoredId> nearbyPreferred = new ArrayList<>();
                List<ScoredId> nearbyAll = new ArrayList<>();
                for (Map<String, Object> p : availablePosts) {
                    String id = parseIdString(p.get("id"));
                    if (id.isEmpty()) continue;

                    String district = normalizeDistrictKey(p.get("district") != null ? p.get("district").toString() : "");
                    if (!nearbyKeys.contains(district)) continue;

                    int score = 60 + categoryPreferenceScore.applyAsInt(p);
                    nearbyAll.add(new ScoredId(id, score));
                    if (hasPreferredCategories && categoryPreferenceScore.applyAsInt(p) > 0) {
                        nearbyPreferred.add(new ScoredId(id, score));
                    }
                }

                nearbyPreferred.sort((a, b) -> Integer.compare(b.score, a.score));
                if (!nearbyPreferred.isEmpty()) {
                    interpretation.strategy = "nearby";
                    List<String> ids = new ArrayList<>();
                    for (int i = 0; i < nearbyPreferred.size() && i < 30; i++) ids.add(nearbyPreferred.get(i).id);
                    return ids;
                }

                nearbyAll.sort((a, b) -> Integer.compare(b.score, a.score));
                if (!nearbyAll.isEmpty()) {
                    interpretation.strategy = "nearby";
                    List<String> ids = new ArrayList<>();
                    for (int i = 0; i < nearbyAll.size() && i < 30; i++) ids.add(nearbyAll.get(i).id);
                    return ids;
                }
            }
        }

        // No district constraint. If we inferred preferred categories from the query's intent,
        // return services in those categories regardless of keywords.
        if (hasPreferredCategories) {
            List<String> ids = new ArrayList<>();
            for (Map<String, Object> p : availablePosts) {
                String id = parseIdString(p.get("id"));
                if (id.isEmpty()) continue;
                String category = p.get("category") != null ? normalizeCategory(p.get("category").toString()) : "";
                if (preferredCategories.contains(category)) ids.add(id);
                if (ids.size() >= 30) break;
            }
            if (!ids.isEmpty()) {
                interpretation.strategy = "category";
                return ids;
            }
        }

        // Softer fallbacks
        List<String> fallback = new ArrayList<>();
        if (hasDistrict) {
            for (Map<String, Object> p : availablePosts) {
                String id = parseIdString(p.get("id"));
                if (id.isEmpty()) continue;
                String district = normalizeDistrictKey(p.get("district") != null ? p.get("district").toString() : "");
                if (district.equals(requiredDistrictKey) || nearbyKeys.contains(district)) fallback.add(id);
            }
            if (!fallback.isEmpty()) {
                interpretation.strategy = "nearby";
                return fallback.subList(0, Math.min(30, fallback.size()));
            }
        }

        interpretation.strategy = "none";
        return new ArrayList<>();
    }

    private List<String> tryRankPostsWithProvider(String originalQuery,
                                                 QueryInterpretation interpretation,
                                                 List<Map<String, Object>> availablePosts) {
        if (!useProviderForSmartSearch) return null;
        if (restTemplate == null || objectMapper == null) return null;

        String q = originalQuery == null ? "" : originalQuery.trim();
        if (q.isEmpty()) return null;

        boolean hasAnyKey = (openAiApiKey != null && !openAiApiKey.trim().isEmpty())
                || (geminiApiKey != null && !geminiApiKey.trim().isEmpty());
        if (!hasAnyKey) return null;

        String compactPostsJson;
        try {
            compactPostsJson = objectMapper.writeValueAsString(buildCompactPostsForAi(availablePosts, 120));
        } catch (Exception e) {
            return null;
        }

        String prompt = buildAiSmartSearchRankingPrompt(q, interpretation, compactPostsJson);

        String raw;
        try {
            if ("openai".equalsIgnoreCase(provider)) {
                raw = callOpenAi(prompt);
            } else {
                raw = callGemini(prompt);
            }
        } catch (Exception e) {
            // Provider unavailable; use heuristic path.
            return null;
        }

        List<String> idsFromAi;
        try {
            idsFromAi = parseAiIds(raw);
        } catch (Exception e) {
            return null;
        }

        // Validate IDs exist, then enforce our deterministic constraints.
        List<String> validated = validateIdsExist(idsFromAi, availablePosts);
        List<String> constrained = applyExplainableConstraints(validated, interpretation, availablePosts);

        if (!constrained.isEmpty()) {
            return constrained;
        }

        // If the AI returns nothing usable, fall back to heuristics.
        return null;
    }

    private List<Map<String, Object>> buildCompactPostsForAi(List<Map<String, Object>> availablePosts, int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (availablePosts == null) return out;

        for (Map<String, Object> p : availablePosts) {
            if (p == null) continue;

            String id = parseIdString(p.get("id"));
            if (id.isEmpty()) continue;

            String title = p.get("title") != null ? p.get("title").toString() : "";
            String description = p.get("description") != null ? p.get("description").toString() : "";
            String category = p.get("category") != null ? p.get("category").toString() : "";
            String district = p.get("district") != null ? p.get("district").toString() : "";

            Map<String, Object> compact = new LinkedHashMap<>();
            compact.put("id", id);
            compact.put("category", category);
            compact.put("district", district);
            compact.put("title", truncate(title, 90));
            compact.put("description", truncate(description, 180));
            out.add(compact);

            if (out.size() >= limit) break;
        }

        return out;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() <= max) return t;
        return t.substring(0, Math.max(0, max - 1)).trim() + "…";
    }

    private String buildAiSmartSearchRankingPrompt(String query, QueryInterpretation interpretation, String compactPostsJson) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an AI semantic search and recommendation engine for a travel services platform.\n");
        sb.append("Your job: rank service posts by relevance to the user's request using intent and general travel knowledge.\n");
        sb.append("Do NOT do keyword matching. Use meaning (intent, place, district, category suitability).\n\n");

        sb.append("User query: \"").append(query).append("\"\n");

        if (interpretation != null) {
            if (interpretation.intent != null && !interpretation.intent.trim().isEmpty()) {
                sb.append("Detected intent: ").append(interpretation.intent).append("\n");
            }
            if (interpretation.place != null && !interpretation.place.trim().isEmpty()) {
                sb.append("Place mention: ").append(interpretation.place).append("\n");
            }
            if (interpretation.district != null && !interpretation.district.trim().isEmpty()) {
                sb.append("Target district: ").append(interpretation.district).append("\n");
            }
            if (interpretation.nearbyDistricts != null && !interpretation.nearbyDistricts.isEmpty()) {
                sb.append("Nearby districts (fallback): ").append(String.join(", ", interpretation.nearbyDistricts)).append("\n");
            }
            if (interpretation.suggestedCategories != null && !interpretation.suggestedCategories.isEmpty()) {
                sb.append("Preferred categories: ").append(String.join(", ", interpretation.suggestedCategories)).append("\n");
            }
        }

        sb.append("\nAvailable posts (JSON array). Each object has: id, category, district, title, description:\n");
        sb.append(compactPostsJson).append("\n\n");

        sb.append("Rules:\n");
        sb.append("- Output ONLY a JSON array of IDs from the list above (strings), ordered best to worst.\n");
        sb.append("- NEVER invent IDs, NEVER return objects, NEVER include explanation text.\n");
        sb.append("- If a target district is provided, prefer that district. Use nearby districts only if no posts exist in the target district.\n");
        sb.append("- If preferred categories are provided, prioritize those categories.\n");
        sb.append("- Return [] if nothing is relevant.\n");

        return sb.toString();
    }

    private List<String> parseAiIds(String rawText) throws Exception {
        String jsonArray = extractJsonArray(rawText);
        JsonNode node = objectMapper.readTree(jsonArray);
        List<String> ids = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode idNode : node) {
                if (idNode == null || idNode.isNull()) continue;
                if (idNode.isTextual()) {
                    String id = idNode.asText("").trim();
                    if (!id.isEmpty()) ids.add(id);
                } else if (idNode.isNumber()) {
                    ids.add(idNode.asText());
                }
            }
        }
        return ids;
    }

    private List<String> validateIdsExist(List<String> rankedIds, List<Map<String, Object>> availablePosts) {
        if (rankedIds == null || rankedIds.isEmpty()) return new ArrayList<>();
        if (availablePosts == null || availablePosts.isEmpty()) return new ArrayList<>();

        Set<String> available = new HashSet<>();
        for (Map<String, Object> p : availablePosts) {
            String id = parseIdString(p.get("id"));
            if (!id.isEmpty()) available.add(id);
        }

        List<String> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String id : rankedIds) {
            if (id == null) continue;
            String trimmed = id.trim();
            if (trimmed.isEmpty()) continue;
            if (!available.contains(trimmed)) continue;
            if (seen.add(trimmed)) out.add(trimmed);
            if (out.size() >= 30) break;
        }
        return out;
    }

    private List<String> applyExplainableConstraints(List<String> rankedIds,
                                                    QueryInterpretation interpretation,
                                                    List<Map<String, Object>> availablePosts) {
        if (rankedIds == null) rankedIds = new ArrayList<>();
        if (availablePosts == null || availablePosts.isEmpty()) return new ArrayList<>();

        final QueryInterpretation interp = interpretation;
        String requiredDistrictKey = interpretation != null && interpretation.districtKey != null ? interpretation.districtKey : "";
        boolean hasDistrict = requiredDistrictKey != null && !requiredDistrictKey.isEmpty();

        Set<String> nearbyKeys = new HashSet<>();
        if (interpretation != null && interpretation.nearbyDistrictKeys != null) {
            for (String ndKey : interpretation.nearbyDistrictKeys) {
                if (ndKey != null && !ndKey.trim().isEmpty()) nearbyKeys.add(ndKey.trim());
            }
        }

        Set<String> preferredCategories = new HashSet<>();
        if (interpretation != null && interpretation.suggestedCategories != null) {
            for (String c : interpretation.suggestedCategories) {
                if (c != null && !c.trim().isEmpty()) preferredCategories.add(c.trim().toLowerCase(Locale.ROOT));
            }
        }
        boolean hasPreferredCategories = !preferredCategories.isEmpty();

        // Build meta lookup for filtering
        Map<String, Map<String, String>> meta = new HashMap<>();
        for (Map<String, Object> p : availablePosts) {
            String id = parseIdString(p.get("id"));
            if (id.isEmpty()) continue;
            String district = normalizeDistrictKey(p.get("district") != null ? p.get("district").toString() : "");
            String category = p.get("category") != null ? normalizeCategory(p.get("category").toString()) : "";
            meta.put(id, Map.of("district", district, "category", category));
        }

        if (!rankedIds.isEmpty()) {
            // If district is specified: keep inside district; nearby only if none in district exist.
            if (hasDistrict) {
                List<String> inDistrict = new ArrayList<>();
                List<String> inDistrictPreferred = new ArrayList<>();
                for (String id : rankedIds) {
                    Map<String, String> m = meta.get(id);
                    if (m == null) continue;
                    if (!requiredDistrictKey.equals(m.get("district"))) continue;
                    inDistrict.add(id);
                    if (hasPreferredCategories && preferredCategories.contains(m.get("category"))) {
                        inDistrictPreferred.add(id);
                    }
                }
                if (!inDistrictPreferred.isEmpty()) {
                    if (interp != null) interp.strategy = "ai_district";
                    return inDistrictPreferred;
                }
                if (!inDistrict.isEmpty()) {
                    if (interp != null) interp.strategy = "ai_district";
                    return inDistrict;
                }

                if (!nearbyKeys.isEmpty()) {
                    List<String> inNearby = new ArrayList<>();
                    List<String> inNearbyPreferred = new ArrayList<>();
                    for (String id : rankedIds) {
                        Map<String, String> m = meta.get(id);
                        if (m == null) continue;
                        if (!nearbyKeys.contains(m.get("district"))) continue;
                        inNearby.add(id);
                        if (hasPreferredCategories && preferredCategories.contains(m.get("category"))) {
                            inNearbyPreferred.add(id);
                        }
                    }
                    if (!inNearbyPreferred.isEmpty()) {
                        if (interp != null) interp.strategy = "ai_nearby";
                        return inNearbyPreferred;
                    }
                    if (!inNearby.isEmpty()) {
                        if (interp != null) interp.strategy = "ai_nearby";
                        return inNearby;
                    }
                }
                return new ArrayList<>();
            }

            // No district constraint: if categories inferred, keep those categories.
            if (hasPreferredCategories) {
                List<String> preferred = new ArrayList<>();
                for (String id : rankedIds) {
                    Map<String, String> m = meta.get(id);
                    if (m == null) continue;
                    if (preferredCategories.contains(m.get("category"))) preferred.add(id);
                }
                if (!preferred.isEmpty()) {
                    if (interp != null) interp.strategy = "ai_category";
                    return preferred;
                }
            }

            if (interp != null) interp.strategy = "ai";
            return rankedIds;
        }

        return new ArrayList<>();
    }

    private static class ScoredId {
        final String id;
        final int score;

        private ScoredId(String id, int score) {
            this.id = id;
            this.score = score;
        }
    }

    private String buildExplainableSearchExplanation(String originalQuery, QueryInterpretation interpretation,
                                                    List<Map<String, Object>> availablePosts, List<String> matchedIds) {
        String q = originalQuery == null ? "" : originalQuery.trim();

        if (q.isEmpty()) {
            return "Tell me what you’re looking for (place, district, or intent like ‘romantic dinner’), and I’ll explain my understanding and suggest relevant services.";
        }

        if (availablePosts == null || availablePosts.isEmpty()) {
            return "I understood your request as: \"" + q + "\". Right now there are no service posts available on the platform, so I can’t recommend anything yet.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("I understood your search as: \"").append(q).append("\". ");

        boolean mentionedPlace = interpretation.place != null && !interpretation.place.trim().isEmpty();
        boolean hasDistrict = interpretation.district != null && !interpretation.district.trim().isEmpty();
        boolean hasCategories = interpretation.suggestedCategories != null && !interpretation.suggestedCategories.isEmpty();

        // Intent-first explanation (prioritize the input)
        if (interpretation.intent != null && !interpretation.intent.equalsIgnoreCase("general")) {
            sb.append("Based on your message, your intent looks ").append(interpretation.intent).append(". ");
        } else {
            sb.append("Based on your message, I treated this as a general request. ");
        }

        if (hasCategories) {
            sb.append("I focused on categories that fit that intent: ")
                    .append(String.join(", ", interpretation.suggestedCategories))
                    .append(". ");
        }

        if (mentionedPlace && hasDistrict) {
            if (interpretation.place.equalsIgnoreCase("Sigiriya")) {
                sb.append("Sigiriya is an ancient rock fortress, located in the ").append(interpretation.district).append(" District. ");
            } else {
                sb.append(interpretation.place).append(" is located in the ").append(interpretation.district).append(" District. ");
            }
        } else if (hasDistrict) {
            sb.append("You mentioned the ").append(interpretation.district).append(" District. ");
        } else {
            sb.append("You didn’t specify a location, so I prioritized your intent first and then searched across all districts (not exact keyword matching). ");

            // Add a small common-sense hint: where people typically get this kind of thing.
            String intent = interpretation.intent == null ? "" : interpretation.intent.trim().toLowerCase(Locale.ROOT);
            if (intent.equals("food")) {
                sb.append("For food/desserts, you can usually get this from restaurants/cafés or hotel dining (sometimes a bakery if listed). ");
            } else if (intent.equals("celebration")) {
                sb.append("For celebrations (like birthdays), people usually choose a restaurant for a meal/cake, a hotel/resort package, and/or an experience (photoshoot, spa, special activity). ");
            } else if (intent.equals("amenities")) {
                sb.append("For facilities like restrooms, hotels and restaurants are the most common places travellers use. ");
            }
        }

        if (matchedIds == null || matchedIds.isEmpty()) {
            // Only mention nearby districts that actually have posts
            List<String> nearbyWithPosts = filterDistrictsWithPosts(interpretation.nearbyDistricts, availablePosts);
            if (hasDistrict && interpretation.nearbyDistricts != null && !interpretation.nearbyDistricts.isEmpty()) {
                if (!nearbyWithPosts.isEmpty()) {
                    sb.append("I couldn’t find matching services for that exact request, so I checked ")
                            .append(interpretation.district)
                            .append(" and nearby districts where services exist (")
                            .append(String.join(", ", nearbyWithPosts))
                            .append("). ");
                } else {
                    sb.append("I couldn’t find matching services for that exact request, and there are no service posts available in nearby districts right now. ");
                }
            } else {
                sb.append("I couldn’t find relevant services for that request in the current service posts. ");
            }
            sb.append("No matching services are available right now.");
            return sb.toString().trim();
        }

        // Make the explanation reflect the actual output so it always matches the shown posts.
        OutputSummary summary = summarizeMatchedPosts(matchedIds, availablePosts);
        if (summary.total > 0) {
            sb.append("I found ").append(summary.total).append(" relevant service")
                    .append(summary.total == 1 ? "" : "s").append(" ");
            if (!summary.topCategories.isEmpty()) {
                sb.append("(top categories: ").append(String.join(", ", summary.topCategories)).append(") ");
            }
            if (!summary.topDistricts.isEmpty()) {
                sb.append("from ").append(String.join(", ", summary.topDistricts)).append(". ");
            } else {
                sb.append("from the current service posts. ");
            }
        }

        switch (interpretation.strategy == null ? "" : interpretation.strategy) {
            case "ai_district" -> sb.append("I used the trip-planner AI model to interpret your intent and selected services from ").append(interpretation.district).append(".");
            case "ai_nearby" -> {
                List<String> nearbyWithPosts = filterDistrictsWithPosts(interpretation.nearbyDistricts, availablePosts);
                if (hasDistrict && nearbyWithPosts != null && !nearbyWithPosts.isEmpty()) {
                    sb.append("I used the trip-planner AI model. No good matches in ").append(interpretation.district)
                            .append(", so I’m showing nearby districts (")
                            .append(String.join(", ", nearbyWithPosts))
                            .append(").");
                } else {
                    sb.append("I used the trip-planner AI model and showed nearby alternatives based on location.");
                }
            }
            case "ai_category" -> sb.append("I used the trip-planner AI model and matched services by intent-related categories.");
            case "ai" -> sb.append("I used the trip-planner AI model and matched services by intent and suitability.");
            case "district" -> sb.append("Showing services primarily from ").append(interpretation.district).append(".");
            case "nearby" -> {
                List<String> nearbyWithPosts = filterDistrictsWithPosts(interpretation.nearbyDistricts, availablePosts);
                if (hasDistrict && nearbyWithPosts != null && !nearbyWithPosts.isEmpty()) {
                    sb.append("No exact matches in ").append(interpretation.district)
                            .append(", so I’m also showing services from nearby districts (")
                            .append(String.join(", ", nearbyWithPosts))
                            .append(").");
                } else {
                    sb.append("Showing nearby alternatives based on location.");
                }
            }
            case "category" -> sb.append("Showing services that match the intent-related categories.");
            default -> sb.append("Showing the most relevant services based on your query.");
        }

        return sb.toString().trim();
    }

    private static class OutputSummary {
        final int total;
        final List<String> topCategories;
        final List<String> topDistricts;

        private OutputSummary(int total, List<String> topCategories, List<String> topDistricts) {
            this.total = total;
            this.topCategories = topCategories;
            this.topDistricts = topDistricts;
        }
    }

    private OutputSummary summarizeMatchedPosts(List<String> matchedIds, List<Map<String, Object>> availablePosts) {
        if (matchedIds == null || matchedIds.isEmpty() || availablePosts == null || availablePosts.isEmpty()) {
            return new OutputSummary(0, new ArrayList<>(), new ArrayList<>());
        }

        Set<String> idSet = new HashSet<>();
        for (String id : matchedIds) {
            if (id != null && !id.trim().isEmpty()) idSet.add(id.trim());
        }
        if (idSet.isEmpty()) return new OutputSummary(0, new ArrayList<>(), new ArrayList<>());

        Map<String, Integer> categoryCounts = new HashMap<>();
        Map<String, Integer> districtCounts = new HashMap<>();
        int total = 0;

        for (Map<String, Object> p : availablePosts) {
            String id = parseIdString(p.get("id"));
            if (id.isEmpty() || !idSet.contains(id)) continue;
            total++;

            String category = p.get("category") != null ? normalizeCategory(p.get("category").toString()) : "";
            String district = p.get("district") != null ? toDistrictDisplayName(normalizeDistrictKey(p.get("district").toString())) : "";

            if (!category.isEmpty()) categoryCounts.put(category, categoryCounts.getOrDefault(category, 0) + 1);
            if (district != null && !district.trim().isEmpty()) districtCounts.put(district, districtCounts.getOrDefault(district, 0) + 1);
        }

        List<String> topCategories = topKeysByCount(categoryCounts, 3);
        List<String> topDistricts = topKeysByCount(districtCounts, 3);

        return new OutputSummary(total, topCategories, topDistricts);
    }

    private List<String> topKeysByCount(Map<String, Integer> counts, int max) {
        if (counts == null || counts.isEmpty()) return new ArrayList<>();

        List<Map.Entry<String, Integer>> entries = new ArrayList<>(counts.entrySet());
        entries.sort((a, b) -> {
            int c = Integer.compare(b.getValue(), a.getValue());
            if (c != 0) return c;
            return a.getKey().compareToIgnoreCase(b.getKey());
        });

        List<String> out = new ArrayList<>();
        for (int i = 0; i < entries.size() && i < max; i++) {
            out.add(entries.get(i).getKey());
        }
        return out;
    }

    private List<String> filterDistrictsWithPosts(List<String> districtsDisplay, List<Map<String, Object>> availablePosts) {
        if (districtsDisplay == null || districtsDisplay.isEmpty() || availablePosts == null || availablePosts.isEmpty()) {
            return new ArrayList<>();
        }
        Set<String> availableKeys = new HashSet<>();
        for (Map<String, Object> p : availablePosts) {
            String key = normalizeDistrictKey(p.get("district") != null ? p.get("district").toString() : "");
            if (!key.isEmpty()) availableKeys.add(key);
        }
        List<String> out = new ArrayList<>();
        for (String d : districtsDisplay) {
            String key = normalizeDistrictKey(d);
            if (!key.isEmpty() && availableKeys.contains(key)) out.add(d);
        }
        return out;
    }

    private String normalizeDistrictKey(String raw) {
        if (raw == null) return "";
        String cleaned = raw.trim().toLowerCase(Locale.ROOT);
        if (cleaned.isEmpty()) return "";

        // Strip common suffixes and punctuation
        cleaned = cleaned.replaceAll("[^a-z\\s]", " ");
        cleaned = cleaned.replaceAll("\\bdistrict\\b", " ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        // Normalize known multi-word district names
        if (cleaned.equals("nuwara eliya")) return "nuwara eliya";
        return cleaned;
    }

    private String parseIdString(Object raw) {
        if (raw == null) return "";
        String s = raw.toString().trim();
        return s.isEmpty() ? "" : s;
    }

    private String toDistrictDisplayName(String districtLower) {
        if (districtLower == null) return "";
        String d = districtLower.trim();
        if (d.isEmpty()) return "";
        if (d.equals("nuwara eliya")) return "Nuwara Eliya";
        return toTitleLike(d);
    }

    private String toTitleLike(String text) {
        if (text == null) return "";
        String[] parts = text.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            if (p.isEmpty()) continue;
            String t = p.substring(0, 1).toUpperCase(Locale.ROOT) + (p.length() > 1 ? p.substring(1) : "");
            if (i > 0) sb.append(' ');
            sb.append(t);
        }
        return sb.toString();
    }
}
