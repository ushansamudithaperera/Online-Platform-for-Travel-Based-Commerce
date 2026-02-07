// src/components/CategoryBookingForm.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getBookingConfig, normalizeCategoryKey } from "../config/bookingCategoryConfig";
import { useAuth } from "../context/AuthContext";
import "../styles/CategoryBookingForm.css";

export default function CategoryBookingForm({
  serviceId,
  category,
  serviceData,
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

  const categoryKey = useMemo(() => {
    const rawCategory = serviceData?.category ?? category;
    const raw = String(rawCategory || "").trim();
    const normalizedRaw = raw.toLowerCase().replace(/\s+/g, " ");

    // Backward compatibility for older category keys that may still exist in data/UI.
    const legacyMap = {
      hotels: "hotel",
      transport: "driver",
      drivers: "driver",
      local_guides: "tour_guide",
      "tour packages": "experience",
      tour_packages: "experience",
      experience_activities: "experience",
      restaurants: "restaurant",
      photographers: "photographers",
    };

    return legacyMap[normalizedRaw] || normalizeCategoryKey(raw);
  }, [category, serviceData?.category]);

  const config = getBookingConfig(categoryKey);

  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const serviceTitle = (serviceData?.title || config.name || "Service").trim();
  const serviceAvatarText = serviceTitle ? serviceTitle.slice(0, 1).toUpperCase() : "S";

  useEffect(() => {
    // Reset form when category changes
    setFormData({
      contactEmail: user?.email || "",
      contactPhone: "",
    });
    setErrors({});
  }, [categoryKey, user?.email]);

  // Generate dynamic fields based on category, pricing, and provider offerings
  const getDynamicFields = () => {
    const baseConfig = getBookingConfig(categoryKey);
    const fields = [];
    const priceUnit = String(serviceData?.priceUnit || "").toLowerCase().trim();
    const offerings = serviceData?.serviceOfferings || {};

    // Common date fields for most categories
    if (categoryKey !== "tour_guide" && categoryKey !== "photographers" && categoryKey !== "restaurant") {
      fields.push(
        {
          name: "checkInDate",
          label: categoryKey === "experience" ? "Activity Date" : "Check-in Date",
          type: "date",
          required: true,
        },
        {
          name: "checkOutDate",
          label: categoryKey === "experience" ? "End Date" : "Check-out Date",
          type: "date",
          required: false,
        }
      );
    }

    // Category-specific fields
    switch (categoryKey) {
      case "hotel":
        // Add room type dropdown with provider's offerings
        if (offerings.roomTypes && offerings.roomTypes.length > 0) {
          fields.push({
            name: "roomType",
            label: "Room Type",
            type: "select",
            options: offerings.roomTypes,
            required: true,
            fromProvider: true,
          });
        }
        
        fields.push({
          name: "numberOfGuests",
          label: "Number of Guests",
          type: "number",
          min: 1,
          required: true,
        });

        if (priceUnit === "per room per night") {
          fields.push({
            name: "numberOfRooms",
            label: "Number of Rooms",
            type: "number",
            min: 1,
            required: true,
          });
        }
        break;

      case "driver":
        // Add vehicle type dropdown with provider's offerings
        if (offerings.vehicleTypes && offerings.vehicleTypes.length > 0) {
          fields.push({
            name: "vehicleType",
            label: "Vehicle Type",
            type: "select",
            options: offerings.vehicleTypes,
            required: true,
            fromProvider: true,
          });
        }

        fields.push(
          {
            name: "pickupLocation",
            label: "Pickup Location",
            type: "text",
            required: true,
          },
          {
            name: "dropoffLocation",
            label: "Drop-off Location",
            type: "text",
            required: true,
          },
          {
            name: "numberOfPassengers",
            label: "Number of Passengers",
            type: "number",
            min: 1,
            required: true,
          }
        );

        if (priceUnit === "per km") {
          fields.push({
            name: "estimatedDistance",
            label: "Estimated Distance (km)",
            type: "number",
            min: 1,
            required: true,
          });
        }
        break;

      case "tour_packages":
        fields.push(
          {
            name: "numberOfTravelers",
            label: "Number of Travelers",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "specialRequests",
            label: "Special Requests",
            type: "textarea",
            required: false,
          }
        );
        break;

      case "restaurant":
        fields.push(
          {
            name: "reservationDate",
            label: "Reservation Date",
            type: "date",
            required: true,
          },
          {
            name: "reservationTime",
            label: "Reservation Time",
            type: "time",
            required: true,
          },
          {
            name: "numberOfGuests",
            label: "Number of Guests",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "dietaryRequirements",
            label: "Dietary Requirements",
            type: "textarea",
            required: false,
          }
        );
        break;

      case "tour_guide":
        fields.push(
          {
            name: "tourDate",
            label: "Tour Date",
            type: "date",
            required: true,
          },
          {
            name: "duration",
            label: "Duration (hours)",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "numberOfPeople",
            label: "Number of People",
            type: "number",
            min: 1,
            required: true,
          }
        );

        // Add language dropdown with provider's offerings
        if (offerings.languages && offerings.languages.length > 0) {
          fields.push({
            name: "preferredLanguage",
            label: "Preferred Language",
            type: "select",
            options: offerings.languages,
            required: false,
            fromProvider: true,
          });
        }

        fields.push({
          name: "areasOfInterest",
          label: "Areas of Interest",
          type: "textarea",
          required: false,
        });
        break;

      case "photographers":
        fields.push(
          {
            name: "eventDate",
            label: "Event Date",
            type: "date",
            required: true,
          },
          {
            name: "eventType",
            label: "Event Type",
            type: "text",
            required: true,
          },
          {
            name: "duration",
            label: "Duration (hours)",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "location",
            label: "Location",
            type: "text",
            required: true,
          },
          {
            name: "additionalRequirements",
            label: "Additional Requirements",
            type: "textarea",
            required: false,
          }
        );
        break;

      case "experience":
        fields.push(
          {
            name: "numberOfParticipants",
            label: "Number of Participants",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "experienceLevel",
            label: "Experience Level",
            type: "select",
            options: ["Beginner", "Intermediate", "Advanced"],
            required: false,
          },
          {
            name: "specialRequirements",
            label: "Special Requirements",
            type: "textarea",
            required: false,
          }
        );
        break;
    }

    return fields;
  };

  const dynamicFields = getDynamicFields();

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
    const requiredFields = dynamicFields.filter((f) => f.required);

    requiredFields.forEach((field) => {
      if (!formData[field.name] || formData[field.name].trim() === "") {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    // Date validation helpers (use local date-only comparisons)
    const parseYmdToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = String(dateStr).split("-").map((p) => Number(p));
      if (parts.length !== 3) return null;
      const [y, m, d] = parts;
      if (!y || !m || !d) return null;
      const date = new Date(y, m - 1, d);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const today = parseYmdToLocalDate(todayStr);
    // No date can be in the past (applies to all categories)
    dynamicFields
      .filter((f) => f.type === "date")
      .forEach((field) => {
        const value = formData[field.name];
        if (!value) return;
        const d = parseYmdToLocalDate(value);
        if (today && d && d < today) {
          newErrors[field.name] = `${field.label} cannot be in the past`;
        }
      });

    // Date range validation (when both exist)
    const checkIn = parseYmdToLocalDate(formData.checkInDate);
    const checkOut = parseYmdToLocalDate(formData.checkOutDate);
    if (checkIn && checkOut && checkOut < checkIn) {
      newErrors.checkOutDate = "Check-out date cannot be earlier than check-in date";
    }

    const validateEmail = (raw) => {
      const email = String(raw || "").trim();
      if (!email) return "Email is required";
      if (email.length > 254) return "Email is too long";
      if (email.includes(" ")) return "Email cannot contain spaces";

      const atIndex = email.indexOf("@");
      if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return "Invalid email format";

      const local = email.slice(0, atIndex);
      const domain = email.slice(atIndex + 1);
      if (!local || !domain) return "Invalid email format";
      if (local.length > 64) return "Email username is too long";
      if (local.startsWith(".") || local.endsWith(".")) return "Invalid email format";
      if (local.includes("..")) return "Invalid email format";

      // Basic allowed characters for local part (pragmatic)
      if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return "Invalid email format";

      // Domain: must have at least one dot and valid labels
      if (!domain.includes(".")) return "Invalid email format";
      if (domain.length > 253) return "Invalid email format";
      const labels = domain.split(".");
      if (labels.some((l) => !l)) return "Invalid email format";
      for (const label of labels) {
        if (label.length > 63) return "Invalid email format";
        if (!/^[A-Za-z0-9-]+$/.test(label)) return "Invalid email format";
        if (label.startsWith("-") || label.endsWith("-")) return "Invalid email format";
      }
      const tld = labels[labels.length - 1];
      if (tld.length < 2) return "Invalid email format";

      return null;
    };

    const validatePhone = (raw) => {
      const phone = String(raw || "").trim();
      if (!phone) return "Phone is required";

      // Reject letters and unexpected characters
      if (/[A-Za-z]/.test(phone)) return "Phone number cannot contain letters";
      if (!/^[0-9+()\-\s.]+$/.test(phone)) return "Phone number contains invalid characters";

      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return "Enter a valid phone number (7–15 digits)";

      // If it starts with '+', enforce E.164-ish: + followed by 8..15 digits, first digit non-zero
      if (phone.startsWith("+")) {
        if (!/^\+[1-9]\d{7,14}$/.test("+" + digits.replace(/^0+/, ""))) {
          // The above normalization is conservative; still allow common +94 formats as long as digit count is OK
          if (!(digits.startsWith("94") && digits.length === 11)) {
            return "Enter a valid international phone number (e.g., +94XXXXXXXXX)";
          }
        }
      }

      // Sri Lanka-friendly common patterns (optional): 0XXXXXXXXX (10 digits) or 94XXXXXXXXX (11 digits)
      if (digits.length === 10 && digits.startsWith("0")) return null;
      if (digits.length === 11 && digits.startsWith("94")) return null;

      // Generic accept if digit length is sane
      return null;
    };

    const emailError = validateEmail(formData.contactEmail);
    if (emailError) newErrors.contactEmail = emailError;

    const phoneError = validatePhone(formData.contactPhone);
    if (phoneError) newErrors.contactPhone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Separate category-specific fields into bookingDetails map
      const { contactEmail, contactPhone, ...dynamicFields } = formData;
      onSubmit({
        serviceId,
        category,
        contactEmail,
        contactPhone,
        bookingDetails: dynamicFields,
      });
    }
  };

  // Group fields by their logical categories
  const groupFieldsByType = () => {
    const dateFields = [];
    const guestFields = [];
    const locationFields = [];
    const preferenceFields = [];
    const otherFields = [];

    dynamicFields.forEach((field) => {
      if (field.type === 'date' || field.type === 'time' || field.name.includes('Date') || field.name.includes('Time')) {
        dateFields.push(field);
      } else if (field.name.includes('Guest') || field.name.includes('Passenger') || field.name.includes('Traveler') || field.name.includes('Participant') || field.name.includes('People') || field.name.includes('Rooms')) {
        guestFields.push(field);
      } else if (field.name.includes('Location') || field.name.includes('location') || field.name.includes('Distance')) {
        locationFields.push(field);
      } else if (field.name.includes('Type') || field.name.includes('Language') || field.name.includes('Level')) {
        preferenceFields.push(field);
      } else {
        otherFields.push(field);
      }
    });

    return { dateFields, guestFields, locationFields, preferenceFields, otherFields };
  };

  const fieldGroups = groupFieldsByType();

  const renderField = (field) => (
    <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
      <label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="required">*</span>}
        {field.fromProvider && (
          <span className="provider-badge" title="Options from provider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Provider Options
          </span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          value={formData[field.name] || ""}
          onChange={handleInputChange}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          rows="4"
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
          min={(() => {
            if (field.type !== "date") return field.min;

            if (field.name === "checkOutDate" && formData.checkInDate) {
              // Use the later of today or check-in date.
              return formData.checkInDate > todayStr ? formData.checkInDate : todayStr;
            }

            return todayStr;
          })()}
          className={errors[field.name] ? "error" : ""}
        />
      )}
      {errors[field.name] && (
        <span className="error-message">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {errors[field.name]}
        </span>
      )}
    </div>
  );

  return (
    <div className="category-booking-form">
      {/* Service Info Summary - Booking.com Style */}
      <div className="booking-header">
        <div className="service-summary-card">
          <div className="summary-top">
            <div className="service-avatar" aria-hidden="true">{serviceAvatarText}</div>
            <div className="summary-content">
              <h3 className="service-title">{serviceTitle}</h3>
              <div className="service-meta">
                <span className="category-badge">{config.name}</span>
                {serviceData?.district && (
                  <span className="location-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {serviceData.district}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Display */}
          {serviceData?.priceFrom && (
            <div className="price-box">
              <div className="price-label">Price</div>
              <div className="price-main">
                <span className="currency">{serviceData.currency || 'LKR'}</span>
                <span className="amount">{serviceData.priceFrom}</span>
                {serviceData.priceTo && serviceData.priceTo !== serviceData.priceFrom && (
                  <span className="price-range"> - {serviceData.priceTo}</span>
                )}
              </div>
              {serviceData.priceUnit && (
                <div className="price-unit">per {serviceData.priceUnit.replace('per ', '')}</div>
              )}
            </div>
          )}

          {/* Provider Offerings Display */}
          {(() => {
            const offerings = serviceData?.serviceOfferings || {};
            const offeringsArray = Object.values(offerings).flat().filter(Boolean);
            return (
              <div className="provider-offerings-display">
                <div className="offerings-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Available Options from Provider</span>
                </div>
                {offeringsArray.length > 0 ? (
                  <div className="offerings-tags">
                    {offeringsArray.map((offering, idx) => (
                      <span key={idx} className="offering-tag">{offering}</span>
                    ))}
                  </div>
                ) : (
                  <div className="offerings-empty">
                    Provider hasn’t specified any selectable options yet.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Date & Time Section */}
        {fieldGroups.dateFields.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10h5v5H7v-5zm12-7h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H5V8h14v13z" />
                </svg>
              </div>
              <div>
                <h4 className="section-title">Date & Time</h4>
                <p className="section-description">When do you need this service?</p>
              </div>
            </div>
            <div className="form-grid">
              {fieldGroups.dateFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Preferences Section */}
        {fieldGroups.preferenceFields.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 18h4v-2h-4v2zm-7-8v2h18v-2H3zm3-6v2h12V4H6zm2 14v2h8v-2H8z" />
                </svg>
              </div>
              <div>
                <h4 className="section-title">Your Preferences</h4>
                <p className="section-description">Select your preferred options</p>
              </div>
            </div>
            <div className="form-grid">
              {fieldGroups.preferenceFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Guest Details Section */}
        {fieldGroups.guestFields.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h7v-3.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div>
                <h4 className="section-title">Guest Details</h4>
                <p className="section-description">How many people are coming?</p>
              </div>
            </div>
            <div className="form-grid">
              {fieldGroups.guestFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Location Details Section */}
        {fieldGroups.locationFields.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                </svg>
              </div>
              <div>
                <h4 className="section-title">Location Details</h4>
                <p className="section-description">Where should we meet or deliver?</p>
              </div>
            </div>
            <div className="form-grid">
              {fieldGroups.locationFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Additional Details Section */}
        {fieldGroups.otherFields.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                </svg>
              </div>
              <div>
                <h4 className="section-title">Additional Information</h4>
                <p className="section-description">Any special requests or requirements?</p>
              </div>
            </div>
            <div className="form-grid">
              {fieldGroups.otherFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="form-section contact-section">
          <div className="section-header">
            <div className="section-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <div>
              <h4 className="section-title">Contact Information</h4>
              <p className="section-description">How can the provider reach you?</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="contactEmail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Email Address
                <span className="required">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={errors.contactEmail ? "error" : ""}
              />
              {errors.contactEmail && (
                <span className="error-message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  {errors.contactEmail}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                Phone Number
                <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+94 XXXXXXXXX"
                className={errors.contactPhone ? "error" : ""}
              />
              {errors.contactPhone && (
                <span className="error-message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  {errors.contactPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Booking Summary & Actions */}
        <div className="booking-footer">
          <div className="booking-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div>
              <strong>Booking Request</strong>
              <p>Your booking request will be sent to the provider for confirmation. You'll receive updates via email and phone.</p>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
