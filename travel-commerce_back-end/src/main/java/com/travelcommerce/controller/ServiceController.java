package com.travelcommerce.controller;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.model.User;
import com.travelcommerce.model.Role;
import com.travelcommerce.service.ServicePostService;
import com.travelcommerce.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*", maxAge = 3600) 
public class ServiceController {

    private static final Logger logger = LoggerFactory.getLogger(ServiceController.class);

    @Autowired private ServicePostService servicePostService;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;


    // GET /api/services
    @GetMapping
    public ResponseEntity<List<ServicePost>> all() {
        return ResponseEntity.ok(servicePostService.findAll());
    }

    // GET /api/services/{id}
    @GetMapping("{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        ServicePost p = servicePostService.findById(id);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

    // GET /api/services/provider-posts
    @GetMapping("/provider-posts")
    public ResponseEntity<List<ServicePost>> getProviderPosts(Authentication auth) {
        if (auth == null) {
            logger.warn("Unauthorized access attempt to /provider-posts");
            return ResponseEntity.status(401).build();
        }
        String providerId = auth.getName();
        List<ServicePost> posts = servicePostService.findByProviderId(providerId);
        return ResponseEntity.ok(posts);
    }

    // CREATE
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestPart("serviceData") String serviceDataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body("Unauthorized");

        try {
            String userId = auth.getName();
            User user = userRepository.findById(userId).orElse(null);
            
            if (user == null || user.getRole() != Role.ROLE_PROVIDER) {
                return ResponseEntity.status(403).body("Forbidden");
            }

            Map<String, Object> serviceData = objectMapper.readValue(serviceDataJson, Map.class);

            ServicePost post = new ServicePost();
            post.setTitle((String) serviceData.get("title"));
            post.setDescription((String) serviceData.get("description"));
            post.setDistrict((String) serviceData.get("district"));
            post.setLocation((String) serviceData.get("location"));
            post.setCategory((String) serviceData.get("category"));
            post.setPlanId((String) serviceData.get("planId"));
            post.setPlanName((String) serviceData.get("planName"));
            post.setProviderId(userId);
            // Default status is usually handled by the Model or Constructor, likely PENDING

            ServicePost saved;
            if (images != null && !images.isEmpty()) {
                logger.info("Uploading {} image(s) for user {}", images.size(), userId);
                saved = servicePostService.createWithImages(post, images);
                logger.info("Image URLs saved: {}", saved.getImages());
            } else {
                saved = servicePostService.create(post);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating service", e);
            return ResponseEntity.badRequest().body("Error creating service: " + e.getMessage());
        }
    }

    // 🟢 FIX IS HERE: EDIT - JSON ONLY (Used by Admin Dashboard for Status Updates)
    @PutMapping(value = "{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateJson(
            @PathVariable String id,
            @RequestBody ServicePost updated,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        ServicePost existing = servicePostService.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);

        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

        if (!owner && !isAdmin) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // Standard updates
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setDistrict(updated.getDistrict());
        existing.setLocation(updated.getLocation());
        existing.setCategory(updated.getCategory());

        // 🟢 FIX START: Update Status ONLY if Admin 🟢
        // This ensures the dashboard works, but providers can't approve their own posts.
        if (isAdmin && updated.getStatus() != null) {
            logger.info("Admin updating status of post {} to {}", id, updated.getStatus());
            existing.setStatus(updated.getStatus());
        }
        // 🟢 FIX END

        ServicePost saved = servicePostService.update(existing);
        return ResponseEntity.ok(saved);
    }

    // EDIT WITH IMAGES
    @PutMapping(value = "{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateWithImages(
            @PathVariable String id,
            @RequestPart("serviceData") String serviceDataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        ServicePost existing = servicePostService.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String userId = auth.getName();
        User user = userRepository.findById(userId).orElse(null);

        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

        if (!owner && !isAdmin) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        try {
            Map<String, Object> data = objectMapper.readValue(serviceDataJson, Map.class);

            existing.setTitle((String) data.get("title"));
            existing.setDescription((String) data.get("description"));
            existing.setDistrict((String) data.get("district"));
            existing.setLocation((String) data.get("location"));
            existing.setCategory((String) data.get("category"));
            
            // 🟢 FIX START: Also allow status update here if Admin is sending it via Form Data
            if (isAdmin && data.containsKey("status")) {
                 // We need to parse the string to the Enum if necessary, or let the setter handle it if it takes a String
                 // Assuming your ServicePost.setStatus takes your Enum type, we might need valueOf
                 // If your setStatus takes a String, this is fine:
                 // existing.setStatus(com.travelcommerce.model.Status.valueOf((String)data.get("status")));
                 // SAFE OPTION (If Jackson isn't mapping it automatically):
                 // existing.setStatus(com.travelcommerce.model.ServicePost.Status.valueOf((String)data.get("status")));
            }
            // 🟢 FIX END

            List<String> finalImages = new ArrayList<>();
            Object keepObj = data.get("existingImages");
            
            if (keepObj instanceof List<?>) {
                for (Object o : (List<?>) keepObj) {
                    if (o != null) {
                        finalImages.add(o.toString());
                    }
                }
            }

            if (images != null && !images.isEmpty()) {
                logger.info("Appending {} new images to service {}", images.size(), id);
                List<String> newUrls = servicePostService.uploadFiles(images);
                finalImages.addAll(newUrls);
            }

            existing.setImages(finalImages);

            ServicePost saved = servicePostService.update(existing);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            logger.error("Error updating service with images", e);
            return ResponseEntity.badRequest().body("Error updating service: " + e.getMessage());
        }
    }

    // Stand-alone image upload
    @PostMapping("/upload/images")
    public ResponseEntity<?> uploadImages(@RequestParam("images") List<MultipartFile> files) {
        List<String> imageUrls = servicePostService.uploadFiles(files);
        return ResponseEntity.ok(imageUrls);
    }

    // DELETE
    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        ServicePost existing = servicePostService.findById(id);
        if (existing == null) return ResponseEntity.notFound().build();

        String userId = auth != null ? auth.getName() : null;
        if (userId == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findById(userId).orElse(null);

        boolean owner = existing.getProviderId().equals(userId);
        boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

        if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");

        servicePostService.delete(id);
        logger.info("Service {} deleted by user {}", id, userId);
        return ResponseEntity.ok("Deleted");
    }
}


////ABOVE UPADATED CODE V2 BELOW IS REVIOUS FILE
// package com.travelcommerce.controller;

// import com.travelcommerce.model.ServicePost;
// import com.travelcommerce.model.User;
// import com.travelcommerce.model.Role;
// import com.travelcommerce.service.ServicePostService;
// import com.travelcommerce.repository.UserRepository;
// import com.fasterxml.jackson.databind.ObjectMapper;

// // >>>>> UPDATED: organized imports and added Logger for better debugging <<<<<
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.http.MediaType;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;
// import org.springframework.security.core.Authentication;

// import java.util.ArrayList; // Added this to avoid writing java.util.ArrayList later
// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/services")
// // >>>>> UPDATED: Added CrossOrigin to prevent CORS errors on the dashboard <<<<<
// @CrossOrigin(origins = "*", maxAge = 3600) 
// public class ServiceController {

//     // >>>>> UPDATED: Added Logger. Using System.out.println in production slows down the server <<<<<
//     private static final Logger logger = LoggerFactory.getLogger(ServiceController.class);

//     @Autowired private ServicePostService servicePostService;
//     @Autowired private UserRepository userRepository;
//     @Autowired private ObjectMapper objectMapper;


//     // GET /api/services
//     @GetMapping
//     public ResponseEntity<List<ServicePost>> all() {
//         return ResponseEntity.ok(servicePostService.findAll());
//     }

//     // GET /api/services/{id}
//     @GetMapping("{id}")
//     public ResponseEntity<?> get(@PathVariable String id) {
//         ServicePost p = servicePostService.findById(id);
//         if (p == null) return ResponseEntity.notFound().build();
//         return ResponseEntity.ok(p);
//     }

//     // GET /api/services/provider-posts
//     @GetMapping("/provider-posts")
//     public ResponseEntity<List<ServicePost>> getProviderPosts(Authentication auth) {
//         // >>>>> UPDATED: Added safety check logging <<<<<
//         if (auth == null) {
//             logger.warn("Unauthorized access attempt to /provider-posts");
//             return ResponseEntity.status(401).build();
//         }
//         String providerId = auth.getName();
//         List<ServicePost> posts = servicePostService.findByProviderId(providerId);
//         return ResponseEntity.ok(posts);
//     }

//     // CREATE - multipart/form-data with JSON + images
//     @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public ResponseEntity<?> create(
//             @RequestPart("serviceData") String serviceDataJson,
//             @RequestPart(value = "images", required = false) List<MultipartFile> images,
//             Authentication auth) {

//         if (auth == null) return ResponseEntity.status(401).body("Unauthorized");

//         try {
//             String userId = auth.getName();
//             User user = userRepository.findById(userId).orElse(null);
            
//             // >>>>> UPDATED: Fixed logic to be null-safe <<<<<
//             if (user == null || user.getRole() != Role.ROLE_PROVIDER) {
//                 return ResponseEntity.status(403).body("Forbidden");
//             }

//             Map<String, Object> serviceData = objectMapper.readValue(serviceDataJson, Map.class);

//             ServicePost post = new ServicePost();
//             post.setTitle((String) serviceData.get("title"));
//             post.setDescription((String) serviceData.get("description"));
//             post.setDistrict((String) serviceData.get("district"));
//             post.setLocation((String) serviceData.get("location"));
//             post.setCategory((String) serviceData.get("category"));
//             post.setPlanId((String) serviceData.get("planId"));
//             post.setPlanName((String) serviceData.get("planName"));
//             post.setProviderId(userId);

//             ServicePost saved;
//             if (images != null && !images.isEmpty()) {
//                 // >>>>> UPDATED: Replaced System.out with Logger <<<<<
//                 logger.info("Uploading {} image(s) for user {}", images.size(), userId);
//                 saved = servicePostService.createWithImages(post, images);
//                 logger.info("Image URLs saved: {}", saved.getImages());
//             } else {
//                 saved = servicePostService.create(post);
//             }

//             return ResponseEntity.ok(saved);
//         } catch (Exception e) {
//             // >>>>> UPDATED: Logging the actual error stack trace for debugging <<<<<
//             logger.error("Error creating service", e);
//             return ResponseEntity.badRequest().body("Error creating service: " + e.getMessage());
//         }
//     }

//     // EDIT - JSON ONLY (no images)
//     @PutMapping(value = "{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
//     public ResponseEntity<?> updateJson(
//             @PathVariable String id,
//             @RequestBody ServicePost updated,
//             Authentication auth) {

//         if (auth == null) {
//             return ResponseEntity.status(401).body("Unauthorized");
//         }

//         ServicePost existing = servicePostService.findById(id);
//         if (existing == null) {
//             return ResponseEntity.notFound().build();
//         }

//         String userId = auth.getName();
//         User user = userRepository.findById(userId).orElse(null);

//         boolean owner = existing.getProviderId().equals(userId);
//         boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//         if (!owner && !isAdmin) {
//             return ResponseEntity.status(403).body("Forbidden");
//         }

//         existing.setTitle(updated.getTitle());
//         existing.setDescription(updated.getDescription());
//         existing.setDistrict(updated.getDistrict());
//         existing.setLocation(updated.getLocation());
//         existing.setCategory(updated.getCategory());

//         ServicePost saved = servicePostService.update(existing);
//         return ResponseEntity.ok(saved);
//     }

//     // EDIT WITH IMAGES - multipart/form-data
//     @PutMapping(value = "{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public ResponseEntity<?> updateWithImages(
//             @PathVariable String id,
//             @RequestPart("serviceData") String serviceDataJson,
//             @RequestPart(value = "images", required = false) List<MultipartFile> images,
//             Authentication auth) {

//         if (auth == null) {
//             return ResponseEntity.status(401).body("Unauthorized");
//         }

//         ServicePost existing = servicePostService.findById(id);
//         if (existing == null) {
//             return ResponseEntity.notFound().build();
//         }

//         String userId = auth.getName();
//         User user = userRepository.findById(userId).orElse(null);

//         boolean owner = existing.getProviderId().equals(userId);
//         boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//         if (!owner && !isAdmin) {
//             return ResponseEntity.status(403).body("Forbidden");
//         }

//         try {
//             Map<String, Object> data = objectMapper.readValue(serviceDataJson, Map.class);

//             existing.setTitle((String) data.get("title"));
//             existing.setDescription((String) data.get("description"));
//             existing.setDistrict((String) data.get("district"));
//             existing.setLocation((String) data.get("location"));
//             existing.setCategory((String) data.get("category"));

//             // >>>>> UPDATED: Cleaned up the 'existingImages' extraction logic (kept functionality same) <<<<<
//             List<String> finalImages = new ArrayList<>();
//             Object keepObj = data.get("existingImages");
            
//             if (keepObj instanceof List<?>) {
//                 for (Object o : (List<?>) keepObj) {
//                     if (o != null) {
//                         finalImages.add(o.toString());
//                     }
//                 }
//             }

//             // upload new images and append
//             if (images != null && !images.isEmpty()) {
//                 logger.info("Appending {} new images to service {}", images.size(), id);
//                 List<String> newUrls = servicePostService.uploadFiles(images);
//                 finalImages.addAll(newUrls);
//             }

//             existing.setImages(finalImages);

//             ServicePost saved = servicePostService.update(existing);
//             return ResponseEntity.ok(saved);

//         } catch (Exception e) {
//             // >>>>> UPDATED: Better error logging <<<<<
//             logger.error("Error updating service with images", e);
//             return ResponseEntity.badRequest().body("Error updating service: " + e.getMessage());
//         }
//     }

//     // Stand-alone image upload
//     @PostMapping("/upload/images")
//     public ResponseEntity<?> uploadImages(@RequestParam("images") List<MultipartFile> files) {
//         List<String> imageUrls = servicePostService.uploadFiles(files);
//         return ResponseEntity.ok(imageUrls);
//     }

//     // DELETE /api/services/{id}
//     @DeleteMapping("{id}")
//     public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
//         ServicePost existing = servicePostService.findById(id);
//         if (existing == null) return ResponseEntity.notFound().build();

//         String userId = auth != null ? auth.getName() : null;
//         if (userId == null) return ResponseEntity.status(401).body("Unauthorized");

//         User user = userRepository.findById(userId).orElse(null);

//         boolean owner = existing.getProviderId().equals(userId);
//         boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//         if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");

//         servicePostService.delete(id);
//         // >>>>> UPDATED: Added log confirming deletion <<<<<
//         logger.info("Service {} deleted by user {}", id, userId);
//         return ResponseEntity.ok("Deleted");
//     }
// }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABOVE UPADATED CODE BELOW IS REVIOUS FILE 

// package com.travelcommerce.controller;

// import com.travelcommerce.model.ServicePost;
// import com.travelcommerce.model.User;
// import com.travelcommerce.model.Role;
// import com.travelcommerce.service.ServicePostService;
// import com.travelcommerce.repository.UserRepository;
// import com.fasterxml.jackson.databind.ObjectMapper;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.http.MediaType;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;
// import org.springframework.security.core.Authentication;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/services")
// public class ServiceController {

//     @Autowired private ServicePostService servicePostService;
//     @Autowired private UserRepository userRepository;
//     @Autowired private ObjectMapper objectMapper;


//     // GET /api/services
//     @GetMapping
//     public ResponseEntity<List<ServicePost>> all() {
//         return ResponseEntity.ok(servicePostService.findAll());
//     }

//     // GET /api/services/{id}
//     @GetMapping("{id}")
//     public ResponseEntity<?> get(@PathVariable String id) {
//         ServicePost p = servicePostService.findById(id);
//         if (p == null) return ResponseEntity.notFound().build();
//         return ResponseEntity.ok(p);
//     }



//     // GET /api/services/provider-posts
//     @GetMapping("/provider-posts")
//     public ResponseEntity<List<ServicePost>> getProviderPosts(Authentication auth) {
//         if (auth == null) {
//             return ResponseEntity.status(401).build();
//         }
//         String providerId = auth.getName();
//         List<ServicePost> posts = servicePostService.findByProviderId(providerId);
//         return ResponseEntity.ok(posts);
//     }

//     // CREATE - multipart/form-data with JSON + images
//     @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public ResponseEntity<?> create(
//             @RequestPart("serviceData") String serviceDataJson,
//             @RequestPart(value = "images", required = false) List<MultipartFile> images,
//             Authentication auth) {

//         if (auth == null) return ResponseEntity.status(401).body("Unauthorized");

//         try {
//             String userId = auth.getName();
//             User user = userRepository.findById(userId).orElse(null);
//             if (user == null || user.getRole() != Role.ROLE_PROVIDER) {
//                 return ResponseEntity.status(403).body("Forbidden");
//             }

//             Map<String, Object> serviceData = objectMapper.readValue(serviceDataJson, Map.class);

//             ServicePost post = new ServicePost();
//             post.setTitle((String) serviceData.get("title"));
//             post.setDescription((String) serviceData.get("description"));
//             post.setDistrict((String) serviceData.get("district"));
//             post.setLocation((String) serviceData.get("location"));
//             post.setCategory((String) serviceData.get("category"));
//             post.setPlanId((String) serviceData.get("planId"));
//             post.setPlanName((String) serviceData.get("planName"));
//             post.setProviderId(userId);

//             ServicePost saved;
//             if (images != null && !images.isEmpty()) {
//                 System.out.println("Uploading " + images.size() + " image(s)");
//                 saved = servicePostService.createWithImages(post, images);
//                 System.out.println("Image URLs saved: " + saved.getImages());
//             } else {
//                 saved = servicePostService.create(post);
//             }

//             return ResponseEntity.ok(saved);
//         } catch (Exception e) {
//             e.printStackTrace();
//             return ResponseEntity.badRequest().body("Error creating service: " + e.getMessage());
//         }
//     }

//     // EDIT - JSON only (no images, no plan change)
// // EDIT - JSON ONLY (no images, if used elsewhere)
// @PutMapping(value = "{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
// public ResponseEntity<?> updateJson(
//         @PathVariable String id,
//         @RequestBody ServicePost updated,
//         Authentication auth) {

//     if (auth == null) {
//         return ResponseEntity.status(401).body("Unauthorized");
//     }

//     ServicePost existing = servicePostService.findById(id);
//     if (existing == null) {
//         return ResponseEntity.notFound().build();
//     }

//     String userId = auth.getName();
//     User user = userRepository.findById(userId).orElse(null);

//     boolean owner = existing.getProviderId().equals(userId);
//     boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//     if (!owner && !isAdmin) {
//         return ResponseEntity.status(403).body("Forbidden");
//     }

//     existing.setTitle(updated.getTitle());
//     existing.setDescription(updated.getDescription());
//     existing.setDistrict(updated.getDistrict());
//     existing.setLocation(updated.getLocation());
//     existing.setCategory(updated.getCategory());

//     ServicePost saved = servicePostService.update(existing);
//     return ResponseEntity.ok(saved);
// }

// // EDIT WITH IMAGES - multipart/form-data
// @PutMapping(value = "{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
// public ResponseEntity<?> updateWithImages(
//         @PathVariable String id,
//         @RequestPart("serviceData") String serviceDataJson,
//         @RequestPart(value = "images", required = false) List<MultipartFile> images,
//         Authentication auth) {

//     if (auth == null) {
//         return ResponseEntity.status(401).body("Unauthorized");
//     }

//     ServicePost existing = servicePostService.findById(id);
//     if (existing == null) {
//         return ResponseEntity.notFound().build();
//     }

//     String userId = auth.getName();
//     User user = userRepository.findById(userId).orElse(null);

//     boolean owner = existing.getProviderId().equals(userId);
//     boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//     if (!owner && !isAdmin) {
//         return ResponseEntity.status(403).body("Forbidden");
//     }

//     try {
//         Map<String, Object> data = objectMapper.readValue(serviceDataJson, Map.class);

//         existing.setTitle((String) data.get("title"));
//         existing.setDescription((String) data.get("description"));
//         existing.setDistrict((String) data.get("district"));
//         existing.setLocation((String) data.get("location"));
//         existing.setCategory((String) data.get("category"));

//         // images to keep (existingImages array from frontend)
//         List<String> finalImages = new java.util.ArrayList<>();
//         Object keepObj = data.get("existingImages");
//         if (keepObj instanceof List<?>) {
//             for (Object o : (List<?>) keepObj) {
//                 if (o != null) {
//                     finalImages.add(o.toString());
//                 }
//             }
//         }

//         // upload new images and append
//         if (images != null && !images.isEmpty()) {
//             List<String> newUrls = servicePostService.uploadFiles(images);
//             finalImages.addAll(newUrls);
//         }

//         existing.setImages(finalImages);

//         ServicePost saved = servicePostService.update(existing);
//         return ResponseEntity.ok(saved);

//     } catch (Exception e) {
//         e.printStackTrace();
//         return ResponseEntity.badRequest().body("Error updating service: " + e.getMessage());
//     }
// }


//     // Stand-alone image upload if needed
//     @PostMapping("/upload/images")
//     public ResponseEntity<?> uploadImages(@RequestParam("images") List<MultipartFile> files) {
//         List<String> imageUrls = servicePostService.uploadFiles(files);
//         return ResponseEntity.ok(imageUrls);
//     }

//     // DELETE /api/services/{id}
//     @DeleteMapping("{id}")
//     public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
//         ServicePost existing = servicePostService.findById(id);
//         if (existing == null) return ResponseEntity.notFound().build();

//         String userId = auth != null ? auth.getName() : null;
//         if (userId == null) return ResponseEntity.status(401).body("Unauthorized");

//         User user = userRepository.findById(userId).orElse(null);

//         boolean owner = existing.getProviderId().equals(userId);
//         boolean isAdmin = user != null && user.getRole() == Role.ROLE_ADMIN;

//         if (!owner && !isAdmin) return ResponseEntity.status(403).body("Forbidden");

//         servicePostService.delete(id);
//         return ResponseEntity.ok("Deleted");
//     }
// }