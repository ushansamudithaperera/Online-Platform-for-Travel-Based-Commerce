package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class ServicePostService {

    @Autowired
    private ServiceRepository repo;

    public List<ServicePost> findAll() {
        // Fetch all posts (you can filter by status elsewhere if needed)
        return repo.findAll();
    }

    public List<ServicePost> findByProviderId(String providerId) {
        return repo.findByProviderId(providerId);
    }

    public ServicePost findById(String id) {
        return repo.findById(id).orElse(null);
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

    // Create post and save images
    public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
        List<String> savedUrls = uploadFiles(files);
        post.setImages(savedUrls);
        return repo.save(post);
    }

    // Store files on disk and return their URLs
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

                // ✅ Store relative URL in DB
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
}