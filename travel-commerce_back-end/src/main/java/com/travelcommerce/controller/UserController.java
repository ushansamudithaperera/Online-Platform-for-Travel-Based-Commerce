package com.travelcommerce.controller;

import com.travelcommerce.model.Role;
import com.travelcommerce.model.User;
import com.travelcommerce.service.UserService;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;

    // 🟢 GET ALL USERS (Admin Only)
    @GetMapping
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        // 1. Security Check
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body("Access Denied: Admins Only");
        }

        // 2. Fetch Data
        List<User> users = userService.findAllUsers();
        
        // 3. Security: Don't send passwords back to frontend!
        users.forEach(u -> u.setPassword(null));
        
        return ResponseEntity.ok(users);
    }

    // 🔴 DELETE USER (Admin Only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication auth) {
        // 1. Security Check
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body("Access Denied: Admins Only");
        }

        // 2. Prevent Admin from deleting themselves
        String currentUserId = auth.getName();
        if (id.equals(currentUserId)) {
            return ResponseEntity.badRequest().body("You cannot delete your own admin account.");
        }

        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // Helper method to check Admin role
    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.getRole() == Role.ROLE_ADMIN;
    }
}
