package com.travelcommerce.controller;

import com.travelcommerce.model.Booking;
import com.travelcommerce.model.User;
import com.travelcommerce.repository.BookingRepository;
import com.travelcommerce.repository.UserRepository;
import com.travelcommerce.repository.ServiceRepository;
import com.travelcommerce.model.ServicePost;
import com.travelcommerce.dto.ApiResponse;
import com.travelcommerce.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
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

    @Autowired
    private NotificationService notificationService;

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

        // Notify provider about new booking
        notificationService.createNotification(
            service.getProviderId(),
            userId,
            user.getFullname(),
            "BOOKING_NEW",
            user.getFullname() + " booked your service \"" + service.getTitle() + "\"",
            saved.getId(),
            service.getId(),
            service.getTitle()
        );

        // Notify all admins about the new booking
        notificationService.notifyAllAdmins(
            userId,
            user.getFullname(),
            "BOOKING_NEW",
            user.getFullname() + " booked \"" + service.getTitle() + "\"",
            saved.getId(),
            service.getId(),
            service.getTitle()
        );

        return ResponseEntity.ok(new ApiResponse(true, "Booking created successfully", Map.of("booking", saved)));
    }

    // Get traveller's bookings
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = auth.getName();
        List<Booking> bookings = bookingRepository.findByTravellerIdAndHiddenByTravellerFalse(userId);
        return ResponseEntity.ok(bookings);
    }

    // Hide booking from traveller's My Bookings (allowed only when CANCELLED or COMPLETED)
    @PutMapping("/{id}/hide")
    public ResponseEntity<?> hideBookingFromTraveller(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Booking not found", null));
        }

        if (!userId.equals(booking.getTravellerId())) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to modify this booking", null));
        }

        String status = booking.getStatus() == null ? "" : booking.getStatus().toUpperCase();
        if (!("CANCELLED".equals(status) || "COMPLETED".equals(status))) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Only completed or cancelled bookings can be removed", null));
        }

        booking.setHiddenByTraveller(true);
        booking.setUpdatedAt(new Date());
        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(new ApiResponse(true, "Booking removed from My Bookings", Map.of("booking", saved)));
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

        String userId = auth.getName();
        if (!userId.equals(booking.getProviderId())) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to update this booking", null));
        }

        String newStatus = body.get("status");
        booking.setStatus(newStatus);
        booking.setUpdatedAt(new Date());
        bookingRepository.save(booking);

        // Notify traveller about status change
        User provider = userRepository.findById(userId).orElse(null);
        String providerName = provider != null ? provider.getFullname() : "Provider";
        String statusLabel = newStatus.substring(0, 1).toUpperCase() + newStatus.substring(1).toLowerCase();
        notificationService.createNotification(
            booking.getTravellerId(),
            userId,
            providerName,
            "BOOKING_" + newStatus.toUpperCase(),
            providerName + " " + statusLabel.toLowerCase() + " your booking for \"" + booking.getServiceTitle() + "\"",
            booking.getId(),
            booking.getServiceId(),
            booking.getServiceTitle()
        );

        return ResponseEntity.ok(new ApiResponse(true, "Status updated", Map.of("booking", booking)));
    }

    // Cancel booking (traveller only) - allowed only when PENDING
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBookingAsTraveller(@PathVariable String id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }

        String userId = auth.getName();
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "Booking not found", null));
        }

        if (!userId.equals(booking.getTravellerId())) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Not authorized to cancel this booking", null));
        }

        if (booking.getStatus() == null || !"PENDING".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Only pending bookings can be cancelled", null));
        }

        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(new Date());
        Booking saved = bookingRepository.save(booking);

        // Notify provider about traveller's cancellation
        User traveller = userRepository.findById(userId).orElse(null);
        String travellerName = traveller != null ? traveller.getFullname() : "Traveller";
        notificationService.createNotification(
            booking.getProviderId(),
            userId,
            travellerName,
            "BOOKING_CANCELLED",
            travellerName + " cancelled their booking for \"" + booking.getServiceTitle() + "\"",
            booking.getId(),
            booking.getServiceId(),
            booking.getServiceTitle()
        );

        return ResponseEntity.ok(new ApiResponse(true, "Booking cancelled", Map.of("booking", saved)));
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

        if (isTraveller && (booking.getStatus() == null || !"PENDING".equalsIgnoreCase(booking.getStatus()))) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Only pending bookings can be cancelled", null));
        }

        bookingRepository.deleteById(id);

        // Notify the other party about the deletion
        User currentUser = userRepository.findById(userId).orElse(null);
        String currentUserName = currentUser != null ? currentUser.getFullname() : "User";
        String recipientId = isTraveller ? booking.getProviderId() : booking.getTravellerId();
        notificationService.createNotification(
            recipientId,
            userId,
            currentUserName,
            "BOOKING_DELETED",
            currentUserName + " deleted the booking for \"" + booking.getServiceTitle() + "\"",
            id,
            booking.getServiceId(),
            booking.getServiceTitle()
        );

        return ResponseEntity.ok(new ApiResponse(true, "Booking deleted", null));
    }
}
