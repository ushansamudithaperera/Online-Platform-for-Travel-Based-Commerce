package com.travelcommerce.controller;

import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.dto.LoginDTO;
import com.travelcommerce.dto.RegisterDTO;
import com.travelcommerce.model.Role;
import com.travelcommerce.model.User;
import com.travelcommerce.service.AuthService;
import com.travelcommerce.service.NotificationService;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private NotificationService notificationService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO body) {
        User u = new User();
        u.setFullname(body.fullname);
        u.setEmail(body.email);
        u.setPassword(body.password);
        u.setTelephone(body.telephone);
        if ("provider".equalsIgnoreCase(body.role)) {
            u.setRole(Role.ROLE_PROVIDER);
        } else if ("admin".equalsIgnoreCase(body.role)) {
            u.setRole(Role.ROLE_ADMIN);
        } else {
            u.setRole(Role.ROLE_TRAVELLER);
        }
        User saved = authService.register(u);

        // Notify all admins about the new registration
        String roleLabel = saved.getRole().name().replace("ROLE_", "").toLowerCase();
        notificationService.notifyAllAdmins(
            saved.getId(),
            saved.getFullname(),
            "NEW_USER_REGISTERED",
            saved.getFullname() + " registered as a new " + roleLabel,
            saved.getId(),
            null,
            null
        );

        return ResponseEntity.ok(new ApiResponse(true, "Registered", Map.of("id", saved.getId())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO body) {
        String token = authService.login(body.email, body.password, body.role);
        User user = userRepository.findByEmail(body.email).orElseThrow();
        user.setPassword(null);
        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ResponseEntity.status(401).body(new ApiResponse(false, "Missing token"));
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) return ResponseEntity.status(401).body(new ApiResponse(false, "Invalid token"));
        String userId = jwtUtil.getUserIdFromToken(token);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(new ApiResponse(false, "User not found"));
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
