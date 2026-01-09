package com.travelcommerce.service;

import com.travelcommerce.model.User;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Get all users (For Admin Dashboard)
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    // Delete a user (Ban/Remove)
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    // Find user by ID (Helper)
    public User findById(String id) {
        return userRepository.findById(id).orElse(null);
    }
}