package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.Review;
import com.travelcommerce.repository.ServiceRepository;
import com.travelcommerce.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class ServicePostService {

    @Autowired
    private ServiceRepository repo;

    @Autowired
    private ReviewRepository reviewRepository;

    // ============================================================
    // CORE CRUD + LOOKUPS
    // ============================================================

    public List<ServicePost> findAll() {
        List<ServicePost> posts = repo.findAll();
        attachRatings(posts);
        return posts;
    }

    public List<ServicePost> findByProviderId(String providerId) {
        List<ServicePost> posts = repo.findByProviderId(providerId);
        attachRatings(posts);
        return posts;
    }

    public ServicePost findById(String id) {
        ServicePost post = repo.findById(id).orElse(null);
        if (post != null) {
            attachRating(post);
        }
        return post;
    }

    public ServicePost create(ServicePost p) {
        return repo.save(p);
    }

    public ServicePost update(ServicePost p) {
        return repo.save(p);
    }

    public void delete(String id) {
        repo.deleteById(id);
    }

    // ============================================================
    // IMAGES
    // ============================================================

    // Create with images
    public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
        List<String> savedUrls = uploadFiles(files);
        post.setImages(savedUrls);
        return repo.save(post);
    }

    // Store files to /uploads and return relative URLs
    public List<String> uploadFiles(List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();

        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        java.io.File directory = new java.io.File(uploadDir);

        if (!directory.exists()) {
            directory.mkdirs();
        }

        for (MultipartFile file : files) {
            try {
                String originalFileName = file.getOriginalFilename();
                String safeFileName = originalFileName != null
                        ? originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_")
                        : "file_" + System.currentTimeMillis();

                String fileName = System.currentTimeMillis() + "_" + safeFileName;

                java.nio.file.Path path = java.nio.file.Paths.get(uploadDir + fileName);
                java.nio.file.Files.copy(file.getInputStream(), path);

                String relativeUrl = "/uploads/" + fileName;
                urls.add(relativeUrl);

                System.out.println("Saved image file: " + path.toAbsolutePath());
                System.out.println("Stored URL in DB: " + relativeUrl);

            } catch (Exception e) {
                throw new RuntimeException("File upload failed", e);
            }
        }
        return urls;
    }

    // ============================================================
    // RATINGS (averageRating, reviewCount)
    // ============================================================

    private void attachRatings(List<ServicePost> posts) {
        if (posts == null) return;
        posts.forEach(this::attachRating);
    }

    private void attachRating(ServicePost post) {
        if (post == null || post.getId() == null) return;

        List<Review> reviews = reviewRepository.findByServiceId(post.getId());
        if (reviews == null || reviews.isEmpty()) {
            post.setAverageRating(0.0);
            post.setReviewCount(0L);
            return;
        }

        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        post.setAverageRating(avg);
        post.setReviewCount((long) reviews.size());
    }

    // ============================================================
    // SEARCH / TRAVELLER HELPERS
    // ============================================================

    /**
     * Search posts by keyword and/or category.
     * Used by admin/traveller dashboards.
     */
    public List<ServicePost> searchPosts(String keyword, String category) {
        List<ServicePost> result;

        if (keyword != null && !keyword.isEmpty()) {
            // Checks Title OR Category for the keyword
            result = repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword);
        } else if (category != null && !category.isEmpty()) {
            // Filters only by Category
            result = repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase("", category);
        } else {
            result = repo.findAll();
        }

        attachRatings(result);
        return result;
    }

    /**
     * Get only ACTIVE posts for travellers.
     * This uses the existing repository method that accepts a String status.
     */
    public List<ServicePost> findActivePosts() {
        List<ServicePost> posts = repo.findByStatus("ACTIVE"); // String, not Status enum
        attachRatings(posts);
        return posts;
    }
}