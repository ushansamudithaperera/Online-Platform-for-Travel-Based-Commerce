package com.travelcommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String fullname;
    private String email;
    private String telephone;
    private String password;
    private Role role;
    private Status status = Status.ACTIVE;
}
