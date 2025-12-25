package com.travelcommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    public String email;

    @NotBlank(message = "Password is required")
    public String password;

    // 🚨 REMOVED @NotBlank annotation here
    // Now the backend won't complain if 'role' is missing/null
    public String role; 
}




// package com.travelcommerce.dto;

// import jakarta.validation.constraints.Email;
// import jakarta.validation.constraints.NotBlank;
// import lombok.Data;

// @Data
// public class LoginDTO {
//     @NotBlank @Email public String email;
//     @NotBlank public String password;
//     @NotBlank public String role;
// }
