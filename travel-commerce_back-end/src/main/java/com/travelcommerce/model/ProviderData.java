package com.travelcommerce.model;

import org.springframework.data.mongodb.core.mapping.Field;

public class ProviderData {
    private String providerType;
    private String district;
    private String bio;
    private String paymentPlan; // optional

    public ProviderData() {}

    // getters/setters
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getPaymentPlan() { return paymentPlan; }
    public void setPaymentPlan(String paymentPlan) { this.paymentPlan = paymentPlan; }
}
