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

        String jsonArray = extractJsonArray(rawText);
        try {
            return objectMapper.readTree(jsonArray);
        } catch (Exception e) {
            throw new RuntimeException("AI response was not valid JSON array", e);
        }
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
            sb.append("- CRITICAL LOCATION RULE: Each activity must use a service that is in the SAME district/region where the traveller is at that time of the itinerary.\n");
            sb.append("- For each day, determine which district/city the traveller is currently in, and ONLY suggest services from that district.\n");
            sb.append("- For travel days (e.g. returning from Galle to Colombo), suggest services in the DEPARTURE city for morning activities and only suggest destination city services AFTER arrival.\n");
            sb.append("- Do NOT mix services from different districts in the same time slot. For example, if the traveller is in Galle at 09:00, do not suggest a Colombo-based driver.\n");
            sb.append("- For drivers/transport, prefer services from the district where the pickup happens.\n");
        } else {
            sb.append("NOTE: There are currently no listed services on the platform.\n");
            sb.append("- Create a general Sri Lanka travel itinerary based on popular destinations.\n");
            sb.append("- Set serviceId and serviceName to empty strings for all activities.\n");
            sb.append("- Write detailed notes with place names, tips, and suggestions.\n");
        }

        sb.append("\nReturn ONLY a raw JSON array (no markdown, no explanation) with this exact structure:\n");
        sb.append("[{ \"day\": 1, \"title\": \"Day title\", \"activities\": [{ \"time\": \"09:00\", \"serviceId\": \"...\", \"serviceName\": \"...\", \"note\": \"Description of the activity\", \"category\": \"Hotel|Tour Guide|Restaurant|Experience|Driver\" }] }]\n");
        sb.append("Make sure each day has 3-6 activities with realistic times. Include meals, transport, and sightseeing.");

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
                    }
                }
            }
            System.out.println("Smart search - Final matched IDs: " + matchedIds);
            return matchedIds;
        } catch (Exception e) {
            System.err.println("Failed to parse AI response: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("AI response was not valid JSON array of IDs", e);
        }
    }

    private String buildSmartSearchPrompt(String postsJson, String searchQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a semantic search assistant for a travel service platform.\n\n");
        sb.append("User's search query: \"").append(searchQuery).append("\"\n\n");
        sb.append("Available services (JSON array with id, title, description, category, district, location, etc.):\n");
        sb.append(postsJson).append("\n\n");
        sb.append("TASK: Analyze the user's query semantically and return a JSON array of service IDs that match.\n");
        sb.append("Consider:\n");
        sb.append("- Synonyms (e.g., 'beach' matches coastal districts, 'accommodation' matches hotels)\n");
        sb.append("- Intent (e.g., 'romantic getaway' matches hotels and restaurants)\n");
        sb.append("- Context (e.g., 'adventure' matches experiences, tour guides, drivers)\n");
        sb.append("- Location variations (e.g., 'south coast' matches Galle, Matara, Hambantota)\n");
        sb.append("- Category understanding (e.g., 'places to stay' matches hotels)\n\n");
        sb.append("Return ONLY a JSON array of matching service IDs, ordered by relevance (most relevant first).\n");
        sb.append("Example: [15, 23, 8, 42]\n\n");
        sb.append("If no services match, return an empty array: []\n");
        sb.append("Return ONLY the JSON array, nothing else.");
        return sb.toString();
    }
}
