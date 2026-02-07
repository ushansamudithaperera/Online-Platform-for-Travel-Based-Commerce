package com.travelcommerce.controller;

import com.travelcommerce.model.Booking;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.BookingRepository;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.repository.ServiceRepository;
import com.travelcommerce.model.ServicePost;
import com.travelcommerce.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ServiceRepository serviceRepository;

    // Create booking
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "User not found", null));
        }

        // Get service details
        ServicePost service = serviceRepository.findById(booking.getServiceId()).orElse(null);
        if (service == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Service not found", null));
        }

        booking.setTravellerId(userId);
        booking.setTravellerName(user.getFullname());
        booking.setServiceTitle(service.getTitle());
        booking.setProviderId(service.getProviderId());
        booking.setStatus("PENDING");

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(new ApiResponse(true, "Booking created successfully", Map.of("booking", saved)));
    }

    // Get traveller's bookings
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = auth.getName();
        List<Booking> bookings = bookingRepository.findByTravellerId(userId);
        return ResponseEntity.ok(bookings);
    }

    // Get provider's bookings
    @GetMapping("/provider-bookings")
    public ResponseEntity<List<Booking>> getProviderBookings(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        String providerId = auth.getName();
        List<Booking> bookings = bookingRepository.findByProviderId(providerId);
        return ResponseEntity.ok(bookings);
    }

    // Update booking status (for providers)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Booking not found", null));
        }

        String newStatus = body.get("status");
        booking.setStatus(newStatus);
        bookingRepository.save(booking);

        return ResponseEntity.ok(new ApiResponse(true, "Status updated", Map.of("booking", booking)));
    }

    // Cancel/Delete booking (for travellers or providers)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        Booking booking = bookingRepository.findById(id).orElse(null);
        
        if (booking == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Booking not found", null));
        }

        // Allow both the traveller who created the booking AND the provider who owns the service
        boolean isTraveller = userId.equals(booking.getTravellerId());
        boolean isProvider = userId.equals(booking.getProviderId());

        if (!isTraveller && !isProvider) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to delete this booking", null));
        }

        bookingRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse(true, "Booking deleted", null));
    }
}
