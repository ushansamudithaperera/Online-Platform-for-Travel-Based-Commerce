// src/components/ServicePricingPanel.jsx
import React, { useState, useEffect } from "react";
import { getBookingConfig } from "../config/bookingCategoryConfig";
import "../styles/ServicePricingPanel.css";

export default function ServicePricingPanel({
  serviceId,
  category,
  existingPricing,
  onSave,
  onCancel,
  isLoading,
}) {
  const [pricingData, setPricingData] = useState({});
  const config = getBookingConfig(category);

  useEffect(() => {
    // Initialize with existing pricing or empty values
    if (existingPricing) {
      setPricingData(existingPricing);
    } else {
      const initialData = {};
      config.pricingDetails.forEach((detail) => {
        initialData[detail.key] = "";
      });
      setPricingData(initialData);
    }
  }, [category, existingPricing]);

  const handleInputChange = (key, value) => {
    setPricingData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      serviceId,
      category,
      pricing: pricingData,
    });
  };

  return (
    <div className="service-pricing-panel">
      <div className="pricing-header">
        <h4>💰 Pricing Details - {config.name}</h4>
        <p>Set your pricing for this service</p>
      </div>

      <form onSubmit={handleSubmit} className="pricing-form">
        <div className="pricing-grid">
          {config.pricingDetails.map((detail) => (
            <div key={detail.key} className="pricing-field">
              <label htmlFor={detail.key}>{detail.label}</label>
              <div className="input-wrapper">
                {detail.type === "number" ? (
                  <>
                    <span className="currency-icon">Rs</span>
                    <input
                      type="number"
                      id={detail.key}
                      value={pricingData[detail.key] || ""}
                      onChange={(e) => handleInputChange(detail.key, e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="price-input"
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    id={detail.key}
                    value={pricingData[detail.key] || ""}
                    onChange={(e) => handleInputChange(detail.key, e.target.value)}
                    placeholder={`Enter ${detail.label.toLowerCase()}`}
                    className="text-input"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Pricing"}
          </button>
        </div>
      </form>
    </div>
  );
}
