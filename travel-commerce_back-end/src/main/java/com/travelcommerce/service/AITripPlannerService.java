package com.travelcommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcommerce.dto.ServiceSummaryDTO;
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
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

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
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

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
}
