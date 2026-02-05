package com.travelcommerce.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:#{null}}")
    private String configuredUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use configured path, or fall back to <user.dir>/uploads
        Path uploadsDir;
        if (configuredUploadDir != null && !configuredUploadDir.isBlank()) {
            uploadsDir = Paths.get(configuredUploadDir);
        } else {
            uploadsDir = Paths.get(System.getProperty("user.dir"), "uploads");
        }

        // toUri() encodes spaces; trailing "/" is REQUIRED by Spring
        String uploadsLocation = uploadsDir.toUri().toString();
        if (!uploadsLocation.endsWith("/")) {
            uploadsLocation += "/";
        }

        System.out.println("[WebConfig] Serving /uploads/** from: " + uploadsLocation);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation)
                .setCachePeriod(3600);
    }
}
