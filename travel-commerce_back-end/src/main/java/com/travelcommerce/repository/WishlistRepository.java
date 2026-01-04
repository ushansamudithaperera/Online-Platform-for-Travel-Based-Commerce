package com.travelcommerce.repository;

import com.travelcommerce.model.Wishlist;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends MongoRepository<Wishlist, String> {
    Optional<Wishlist> findByUserIdAndServiceId(String userId, String serviceId);

    boolean existsByUserIdAndServiceId(String userId, String serviceId);

    void deleteByUserIdAndServiceId(String userId, String serviceId);

    List<Wishlist> findByUserId(String userId);
}
