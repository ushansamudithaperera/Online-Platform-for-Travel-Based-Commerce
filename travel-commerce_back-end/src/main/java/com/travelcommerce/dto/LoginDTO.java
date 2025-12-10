package com.travelcommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {
    @NotBlank @Email public String email;
    @NotBlank public String password;
    @NotBlank public String role;
}
