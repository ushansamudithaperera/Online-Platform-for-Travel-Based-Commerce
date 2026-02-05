// src/components/BookingDetailsCard.jsx
import React, { useState } from "react";
import { getBookingConfig } from "../config/bookingCategoryConfig";
import ServicePricingPanel from "./ServicePricingPanel";
import "../styles/BookingDetailsCard.css";

export default function BookingDetailsCard({
  booking,
  isProvider = false,
  onStatusChange,
  onDeleteBooking,
}) {
  const [showPricingPanel, setShowPricingPanel] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const config = getBookingConfig(booking.category);

  const statusColors = {
    PENDING: "#FFA500",
    CONFIRMED: "#4CAF50",
    CANCELLED: "#F44336",
    COMPLETED: "#2196F3",
  };

  const handleStatusChange = async (newStatus) => {
    if (window.confirm(`Change booking status to ${newStatus}?`)) {
      setIsUpdating(true);
      try {
        await onStatusChange(booking.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderDynamicFields = () => {
    return config.fields.map((field) => {
      const value = booking[field.name];
      if (!value) return null;

      return (
        <div key={field.name} className="detail-row">
          <span className="detail-label">{field.label}:</span>
          <span className="detail-value">{value}</span>
        </div>
      );
    });
  };

  return (
    <div className="booking-details-card">
      {/* Header */}
      <div className="card-header">
        <div className="header-left">
          <h4>{booking.serviceTitle}</h4>
          <p className="booking-id">Booking #{booking.id?.slice(-6)}</p>
        </div>
        <div className="header-right">
          <span
            className="status-badge"
            style={{ backgroundColor: statusColors[booking.status] }}
          >
            {booking.status}
          </span>
        </div>
      </div>

      {/* Service Category Badge */}
      <div className="category-badge">
        <span className="category-icon">📍</span>
        {config.name}
      </div>

      {/* Dynamic Booking Details */}
      <div className="details-section">
        <h5>Booking Details</h5>
        <div className="details-grid">
          {renderDynamicFields()}
          <div className="detail-row">
            <span className="detail-label">Contact Email:</span>
            <span className="detail-value">{booking.contactEmail}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Contact Phone:</span>
            <span className="detail-value">{booking.contactPhone}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Traveller:</span>
            <span className="detail-value">{booking.travellerName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Booking Date:</span>
            <span className="detail-value">{formatDate(booking.createdAt)}</span>
          </div>
        </div>
        {booking.message && (
          <div className="message-section">
            <p><strong>Message:</strong></p>
            <p className="message-text">{booking.message}</p>
          </div>
        )}
      </div>

      {/* Pricing Information (Provider View) */}
      {isProvider && !showPricingPanel && (
        <div className="pricing-info-section">
          <div className="pricing-header">
            <h5>💰 Pricing Information</h5>
            <button
              className="btn-small"
              onClick={() => setShowPricingPanel(true)}
            >
              ✏️ Set Pricing
            </button>
          </div>

          {booking.pricingDetails ? (
            <div className="pricing-details">
              {Object.entries(booking.pricingDetails).map(([key, value]) => (
                <div key={key} className="pricing-row">
                  <span className="pricing-label">{key.replace(/([A-Z])/g, " $1")}:</span>
                  <span className="pricing-value">Rs {value || "Not Set"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-pricing">No pricing set yet. Click "Set Pricing" to add details.</p>
          )}
        </div>
      )}

      {/* Pricing Panel */}
      {showPricingPanel && (
        <ServicePricingPanel
          serviceId={booking.serviceId}
          category={booking.category}
          existingPricing={booking.pricingDetails}
          onSave={() => {
            setShowPricingPanel(false);
            // Optionally refresh booking details here
          }}
          onCancel={() => setShowPricingPanel(false)}
          isLoading={isUpdating}
        />
      )}

      {/* Actions (Provider View) */}
      {isProvider && (
        <div className="actions-section">
          <div className="status-actions">
            <label>Update Status:</label>
            <select
              value={booking.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="status-select"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => onDeleteBooking(booking.id)}
            disabled={isUpdating}
          >
            Delete Booking
          </button>
        </div>
      )}
    </div>
  );
}
