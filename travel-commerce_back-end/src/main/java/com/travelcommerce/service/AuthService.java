package com.travelcommerce.service;

import com.travelcommerce.model.Role;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    public User register(User u) {
        Optional<User> exists = userRepository.findByEmail(u.getEmail());
        if (exists.isPresent()) throw new RuntimeException("Email already in use");
        u.setPassword(passwordEncoder.encode(u.getPassword()));
        if (u.getRole() == null) u.setRole(Role.ROLE_TRAVELLER);
        return userRepository.save(u);
    }

    public String login(String email, String password, String roleStr) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPassword())) throw new RuntimeException("Invalid credentials");
        // optional: check role
        String roleName = user.getRole().name();
        return jwtUtil.generateToken(user.getId(), roleName);
    }
}
