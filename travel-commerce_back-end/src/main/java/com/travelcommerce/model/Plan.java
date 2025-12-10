package com.travelcommerce.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Plan {
    private String id;
    private String name;
    private double price;
    private int photoLimit;
}
