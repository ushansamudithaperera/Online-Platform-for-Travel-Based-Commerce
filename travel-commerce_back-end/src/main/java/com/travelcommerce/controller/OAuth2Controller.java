package com.travelcommerce.controller;

import com.travelcommerce.config.JwtUtil;
import com.travelcommerce.model.Role;
import com.travelcommerce.model.Status;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/callback/google")
    public ResponseEntity<?> googleCallback(@RequestBody Map<String, String> body) {
        try {
            String googleToken = body.get("token");
            String roleStr = body.get("role");
            // Parse JWT (Google ID token) payload
            String[] parts = googleToken.split("\\.");
            if (parts.length != 3) return ResponseEntity.badRequest().body("Invalid token");
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> payload = new ObjectMapper().readValue(payloadJson, Map.class);

            String email = (String) payload.get("email");
            String name = (String) payload.getOrDefault("name", "Google User");
            if (email == null) return ResponseEntity.badRequest().body("No email in token");

            // Find or create user
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setFullname(name);
                // Set role from frontend if valid
                if (roleStr != null && roleStr.equalsIgnoreCase("provider")) {
                    u.setRole(Role.ROLE_PROVIDER);
                } else {
                    u.setRole(Role.ROLE_TRAVELLER);
                }
                u.setStatus(Status.ACTIVE);
                return u;
            });
            // If new user, save
            if (user.getId() == null) {
                user = userRepository.save(user);
            }
            // If user exists but role is not set, update role if provided
            if (user.getRole() == null && roleStr != null) {
                if (roleStr.equalsIgnoreCase("provider")) {
                    user.setRole(Role.ROLE_PROVIDER);
                } else {
                    user.setRole(Role.ROLE_TRAVELLER);
                }
                user = userRepository.save(user);
            }

            // Issue JWT
            String jwt = jwtUtil.generateToken(user.getId(), user.getRole().name());

            // Return user info and JWT
            return ResponseEntity.ok(Map.of(
                "user", user,
                "token", jwt
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Google login failed: " + e.getMessage());
        }
    }
}
