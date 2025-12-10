package com.travelcommerce.service;

import com.travelcommerce.model.User;
import com.travelcommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@Transactional // FIX 3: Add transactional for robust DB fetching
public class JwtUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    // FIX 2: loadUserByUsername must be implemented to find the user by ID (as your JwtUtil token contains the ID)
    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        // CRITICAL: Ensure the role is prefixed with "ROLE_" before passing to GrantedAuthority
        // The authority name for the user must match the one checked by hasRole() in SecurityConfig
        String roleAuthority = "ROLE_" + u.getRole().name();
        
        return new org.springframework.security.core.userdetails.User(
                u.getId(), // Principal name will be the userId
                u.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(roleAuthority))
        );
    }
}