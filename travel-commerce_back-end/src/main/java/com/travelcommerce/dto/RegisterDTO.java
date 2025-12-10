package com.travelcommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank public String fullname;
    @NotBlank @Email public String email;
    public String telephone;
    @NotBlank public String password;
    @NotBlank public String role; // "provider" or "traveller"
}
