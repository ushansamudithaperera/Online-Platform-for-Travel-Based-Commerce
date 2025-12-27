// src/main/java/com/travelcommerce/service/ServicePostService.java

package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class ServicePostService {
    @Autowired private ServiceRepository repo;

    public List<ServicePost> findAll() { 
        // Assuming this fetches published/active posts for the Traveller Dashboard
        return repo.findAll(); 
    }
    
    // ⬅️ CRITICAL FIX: Add the missing method implementation
    public List<ServicePost> findByProviderId(String providerId) {
        return repo.findByProviderId(providerId); // Calls the method defined in the repository
    }
    
    public ServicePost findById(String id) { return repo.findById(id).orElse(null); }
    public ServicePost create(ServicePost p) { return repo.save(p); }
    public ServicePost update(ServicePost p) { return repo.save(p); }
    public void delete(String id) { repo.deleteById(id); }




    // ⬅️ NEW METHOD: Handles creating the post and saving the images
    public ServicePost createWithImages(ServicePost post, List<MultipartFile> files) {
        List<String> savedUrls = uploadFiles(files);
        post.setImages(savedUrls); // Save the generated URLs into the MongoDB document
        return repo.save(post);
    }

    // Helper to handle file storage logic
    public List<String> uploadFiles(List<MultipartFile> files) {
        List<String> urls = new java.util.ArrayList<>();
        String uploadDir = "uploads/"; // Ensure this folder exists in your project root

        java.io.File directory = new java.io.File(uploadDir);
        if (!directory.exists()) directory.mkdirs();

        for (MultipartFile file : files) {
            try {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                java.nio.file.Path path = java.nio.file.Paths.get(uploadDir + fileName);
                java.nio.file.Files.copy(file.getInputStream(), path);
                
                // This URL must be accessible by your frontend (e.g. via ResourceHandler)
                urls.add("/uploads/" + fileName); 
            } catch (java.io.IOException e) {
                throw new RuntimeException("Could not store file", e);
            }
        }
        return urls;
    }





}

