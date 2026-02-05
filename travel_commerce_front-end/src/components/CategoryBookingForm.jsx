// src/components/CategoryBookingForm.jsx
import React, { useState, useEffect } from "react";
import { getBookingConfig } from "../config/bookingCategoryConfig";
import { useAuth } from "../context/AuthContext";
import "../styles/CategoryBookingForm.css";

export default function CategoryBookingForm({
  serviceId,
  category,
  onSubmit,
  onCancel,
  isLoading,
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    contactEmail: user?.email || "",
    contactPhone: "",
  });
  const [errors, setErrors] = useState({});

  const config = getBookingConfig(category);

  useEffect(() => {
    // Reset form when category changes
    setFormData({
      contactEmail: user?.email || "",
      contactPhone: "",
    });
    setErrors({});
  }, [category, user?.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = config.fields.filter((f) => f.required);

    requiredFields.forEach((field) => {
      if (!formData[field.name] || formData[field.name].trim() === "") {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (!formData.contactEmail || !formData.contactEmail.trim()) {
      newErrors.contactEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }

    if (!formData.contactPhone || !formData.contactPhone.trim()) {
      newErrors.contactPhone = "Phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        serviceId,
        category,
        ...formData,
      });
    }
  };

  return (
    <div className="category-booking-form">
      <div className="form-header">
        <h3>{config.name} Booking</h3>
        <p>Please provide the following details for your booking</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Dynamic Category-Specific Fields */}
        <div className="form-section">
          <h4 className="section-title">Booking Details</h4>
          <div className="form-grid">
            {config.fields.map((field) => (
              <div key={field.name} className="form-group">
                <label htmlFor={field.name}>
                  {field.label} {field.required && <span className="required">*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows="3"
                    className={errors[field.name] ? "error" : ""}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    className={errors[field.name] ? "error" : ""}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    min={field.min}
                    className={errors[field.name] ? "error" : ""}
                    required={field.required}
                  />
                )}
                {errors[field.name] && (
                  <span className="error-message">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h4 className="section-title">Contact Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="contactEmail">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={errors.contactEmail ? "error" : ""}
                required
              />
              {errors.contactEmail && (
                <span className="error-message">{errors.contactEmail}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">
                Phone <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+94 XXXXXXXXX"
                className={errors.contactPhone ? "error" : ""}
                required
              />
              {errors.contactPhone && (
                <span className="error-message">{errors.contactPhone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
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
            {isLoading ? "Submitting..." : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
