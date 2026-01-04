package com.travelcommerce.service;

import com.travelcommerce.dto.ServiceResponseDTO;
import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.Wishlist;
import com.travelcommerce.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ServicePostService servicePostService;

    /**
     * @return true if the service is now favorited, false if it was removed.
     */
    public boolean toggle(String userId, String serviceId) {
        Objects.requireNonNull(userId, "userId is required");
        Objects.requireNonNull(serviceId, "serviceId is required");

        return wishlistRepository.findByUserIdAndServiceId(userId, serviceId)
                .map(existing -> {
                    wishlistRepository.deleteByUserIdAndServiceId(userId, serviceId);
                    return false;
                })
                .orElseGet(() -> {
                    Wishlist wishlist = new Wishlist();
                    wishlist.setUserId(userId);
                    wishlist.setServiceId(serviceId);
                    wishlistRepository.save(wishlist);
                    return true;
                });
    }

    public List<String> getWishlistIds(String userId) {
        Objects.requireNonNull(userId, "userId is required");
        List<Wishlist> items = wishlistRepository.findByUserId(userId);
        List<String> ids = new ArrayList<>();
        for (Wishlist item : items) {
            if (item != null && item.getServiceId() != null) {
                ids.add(item.getServiceId());
            }
        }
        return ids;
    }

    public List<ServiceResponseDTO> getWishlist(String userId) {
        Objects.requireNonNull(userId, "userId is required");
        List<Wishlist> items = wishlistRepository.findByUserId(userId);
        List<ServiceResponseDTO> result = new ArrayList<>();

        for (Wishlist item : items) {
            if (item == null || item.getServiceId() == null) continue;
            ServicePost post = servicePostService.findById(item.getServiceId());
            if (post != null) {
                result.add(ServiceResponseDTO.from(post));
            }
        }

        return result;
    }
}
