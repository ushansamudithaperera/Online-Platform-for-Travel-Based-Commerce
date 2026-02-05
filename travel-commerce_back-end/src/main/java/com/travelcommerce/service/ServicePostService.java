package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import com.travelcommerce.repository.ReviewRepository;
import com.travelcommerce.model.Review;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class ServicePostService {

    @Autowired
    private ServiceRepository repo;

    @Autowired
    private ReviewRepository reviewRepository;

    @Value("${app.upload-dir:#{null}}")
    private String configuredUploadDir;
    // ==================================================================================
    // 🟢 TEAMMATES' ORIGINAL CODE (DO NOT TOUCH - KEEPS APP WORKING)
    // ==================================================================================

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

    // Create with images
    public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
        List<String> savedUrls = uploadFiles(files);
        post.setImages(savedUrls);
        return repo.save(post);
    }

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
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        post.setAverageRating(avg);
        post.setReviewCount((long) reviews.size());
    }

    // Store files to /uploads and return relative URLs
    public List<String> uploadFiles(List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();

        // Use configured path, or fall back to <user.dir>/uploads
        Path uploadDir;
        if (configuredUploadDir != null && !configuredUploadDir.isBlank()) {
            uploadDir = Paths.get(configuredUploadDir);
        } else {
            uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
        }

        try {
            Files.createDirectories(uploadDir);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create uploads directory", e);
        }

        for (MultipartFile file : files) {
            try {
                String originalFileName = file.getOriginalFilename();
                String safeFileName = originalFileName != null
                        ? originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_")
                        : "file_" + System.currentTimeMillis();

                String fileName = System.currentTimeMillis() + "_" + safeFileName;

                Path path = uploadDir.resolve(fileName);
                Files.copy(file.getInputStream(), path);

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

    // ==================================================================================
    // 🔴 MY ADMIN / TRAVELLER EXTENSIONS
    // ==================================================================================

    public List<ServicePost> searchPosts(String keyword, String category) {
        if (keyword != null && !keyword.isEmpty()) {
            return repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword);
        } else if (category != null && !category.isEmpty()) {
            return repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase("", category);
        } else {
            return repo.findAll();
        }
    }

    // 🟢 NEW: Get only Active posts for Travellers
    public List<ServicePost> findActivePosts() {
        return repo.findByStatus("ACTIVE");
    }
}


//-------------------------------//
//blow is the correct code above the v2

// package com.travelcommerce.service;

// import com.travelcommerce.model.ServicePost;
// import com.travelcommerce.repository.ServiceRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import java.util.ArrayList;
// import java.util.List;

// @Service
// public class ServicePostService {

//     @Autowired
//     private ServiceRepository repo;

//     // ==================================================================================
//     // 🟢 TEAMMATES' ORIGINAL CODE (DO NOT TOUCH - KEEPS APP WORKING)
//     // ==================================================================================

//     public List<ServicePost> findAll() {
//         return repo.findAll();
//     }

//     public List<ServicePost> findByProviderId(String providerId) {
//         return repo.findByProviderId(providerId);
//     }

//     public ServicePost findById(String id) {
//         return repo.findById(id).orElse(null);
//     }

//     public ServicePost create(ServicePost p) {
//         return repo.save(p);
//     }

//     public ServicePost update(ServicePost p) {
//         return repo.save(p);
//     }

//     public void delete(String id) {
//         repo.deleteById(id);
//     }

//     // Create with images
//     public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
//         List<String> savedUrls = uploadFiles(files);
//         post.setImages(savedUrls);
//         return repo.save(post);
//     }

//     // Store files to /uploads and return relative URLs
//     public List<String> uploadFiles(List<MultipartFile> files) {
//         List<String> urls = new ArrayList<>();

//         String uploadDir = System.getProperty("user.dir") + "/uploads/";
//         java.io.File directory = new java.io.File(uploadDir);

//         if (!directory.exists()) {
//             directory.mkdirs();
//         }

//         for (MultipartFile file : files) {
//             try {
//                 String originalFileName = file.getOriginalFilename();
//                 String safeFileName = originalFileName != null
//                         ? originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_")
//                         : "file_" + System.currentTimeMillis();

//                 String fileName = System.currentTimeMillis() + "_" + safeFileName;

//                 java.nio.file.Path path = java.nio.file.Paths.get(uploadDir + fileName);
//                 java.nio.file.Files.copy(file.getInputStream(), path);

//                 String relativeUrl = "/uploads/" + fileName;
//                 urls.add(relativeUrl);

//                 System.out.println("Saved image file: " + path.toAbsolutePath());
//                 System.out.println("Stored URL in DB: " + relativeUrl);

//             } catch (Exception e) {
//                 throw new RuntimeException("File upload failed", e);
//             }
//         }
//         return urls;
//     }

//     // ==================================================================================
//     // 🔴 My ADMIN EXTENSIONS (REQUIRED FOR DASHBOARD)
//     // ==================================================================================

//     public List<ServicePost> searchPosts(String keyword, String category) {
//         if (keyword != null && !keyword.isEmpty()) {
//             // Checks Title OR Category for the keyword
//             return repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword);
//         } else if (category != null && !category.isEmpty()) {
//             // Filters only by Category
//             return repo.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase("", category);
//         } else {
//             return repo.findAll();
//         }
//     }
// }


// package com.travelcommerce.service;

// import com.travelcommerce.model.ServicePost;
// import com.travelcommerce.repository.ServiceRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import java.util.ArrayList;
// import java.util.List;

// @Service
// public class ServicePostService {

//     @Autowired
//     private ServiceRepository repo;

//     public List<ServicePost> findAll() {
//         return repo.findAll();
//     }

//     public List<ServicePost> findByProviderId(String providerId) {
//         return repo.findByProviderId(providerId);
//     }

//     public ServicePost findById(String id) {
//         return repo.findById(id).orElse(null);
//     }

//     public ServicePost create(ServicePost p) {
//         return repo.save(p);
//     }

//     public ServicePost update(ServicePost p) {
//         return repo.save(p);
//     }

//     public void delete(String id) {
//         repo.deleteById(id);
//     }

//     // Create with images
//     public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
//         List<String> savedUrls = uploadFiles(files);
//         post.setImages(savedUrls);
//         return repo.save(post);
//     }

//     // Store files to /uploads and return relative URLs
//     public List<String> uploadFiles(List<MultipartFile> files) {
//         List<String> urls = new ArrayList<>();

//         String uploadDir = System.getProperty("user.dir") + "/uploads/";
//         java.io.File directory = new java.io.File(uploadDir);

//         if (!directory.exists()) {
//             directory.mkdirs();
//         }

//         for (MultipartFile file : files) {
//             try {
//                 String originalFileName = file.getOriginalFilename();
//                 String safeFileName = originalFileName != null
//                         ? originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_")
//                         : "file_" + System.currentTimeMillis();

//                 String fileName = System.currentTimeMillis() + "_" + safeFileName;

//                 java.nio.file.Path path = java.nio.file.Paths.get(uploadDir + fileName);
//                 java.nio.file.Files.copy(file.getInputStream(), path);

//                 String relativeUrl = "/uploads/" + fileName;
//                 urls.add(relativeUrl);

//                 System.out.println("Saved image file: " + path.toAbsolutePath());
//                 System.out.println("Stored URL in DB: " + relativeUrl);

//             } catch (Exception e) {
//                 throw new RuntimeException("File upload failed", e);
//             }
//         }
//         return urls;
//     }
// }