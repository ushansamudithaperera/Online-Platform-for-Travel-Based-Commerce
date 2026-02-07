// src/components/BookingDetailsCard.jsx
import React, { useState } from "react";
import { getBookingConfig } from "../config/bookingCategoryConfig";
import { useToast } from "../context/ToastContext";
import "../styles/BookingDetailsCard.css";

export default function BookingDetailsCard({
  booking,
  isProvider = false,
  onStatusChange,
  onDeleteBooking,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = getBookingConfig(booking.category);
  const toast = useToast();

  const statusColors = {
    PENDING: "#FFA500",
    CONFIRMED: "#4CAF50",
    CANCELLED: "#F44336",
    COMPLETED: "#2196F3",
  };

  const handleStatusChange = async (newStatus) => {
    const confirmed = await toast.confirm({
      title: "Update Status",
      message: `Change booking status to ${newStatus}?`,
      type: "warning",
      confirmText: "Update",
    });
    if (confirmed) {
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
      const value = booking.bookingDetails?.[field.name] ?? booking[field.name];
      if (!value) return null;

      // Format date fields nicely
      let displayValue = value;
      if (field.type === "date" && value) {
        displayValue = formatDate(value);
      }

      return (
        <div key={field.name} className="detail-row">
          <span className="detail-label">{field.label}:</span>
          <span className="detail-value">{displayValue}</span>
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
