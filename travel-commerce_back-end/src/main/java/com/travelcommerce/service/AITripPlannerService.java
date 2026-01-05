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

        String prompt = buildPrompt(servicesJson, trimmedQuery, days);

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

    private String buildPrompt(String servicesJson, String userQuery, int numDays) {
        return "Here is a list of available services: " + servicesJson + "\n" +
                "The user wants: '" + userQuery + "'.\n" +
                "Create a " + numDays + "-day itinerary using ONLY these services.\n" +
                "Return the response as raw JSON with structure: " +
                "[{ day: 1, activities: [{ time: '10:00', serviceId: '...', note: '...' }] }].\n" +
                "Return ONLY the JSON array (no markdown, no explanation).";
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
}
