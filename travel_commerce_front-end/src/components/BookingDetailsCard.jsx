// src/components/BookingDetailsCard.jsx
import React, { useState } from "react";
import { getBookingConfig } from "../config/bookingCategoryConfig";
import { useToast } from "../context/ToastContext";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaClock,
  FaMapMarkerAlt,
  FaTrashAlt,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaChevronDown,
} from "react-icons/fa";
import "../styles/BookingDetailsCard.css";

export default function BookingDetailsCard({
  booking,
  isProvider = false,
  onStatusChange,
  onDeleteBooking,
  onCancelBooking,
  onViewPost,
  onRemoveBooking,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = getBookingConfig(booking.category);
  const toast = useToast();

  const statusConfig = {
    PENDING: { color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", label: "Pending", icon: "⏳" },
    CONFIRMED: { color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", label: "Confirmed", icon: "✓" },
    CANCELLED: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", label: "Cancelled", icon: "✕" },
    COMPLETED: { color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", label: "Completed", icon: "★" },
  };

  const currentStatus = statusConfig[booking.status] || statusConfig.PENDING;

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

  const handleCancelAsTraveller = async () => {
    if (!onCancelBooking) return;
    setIsUpdating(true);
    try {
      await onCancelBooking(booking.id);
    } finally {
      setIsUpdating(false);
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

  const fieldIcons = {
    date: <FaCalendarAlt />,
    time: <FaClock />,
    email: <FaEnvelope />,
    phone: <FaPhone />,
    text: <FaMapMarkerAlt />,
  };

  const renderDynamicFields = () => {
    return config.fields.map((field) => {
      const value = booking.bookingDetails?.[field.name] ?? booking[field.name];
      if (!value) return null;

      let displayValue = value;
      if (field.type === "date" && value) {
        displayValue = formatDate(value);
      }

      return (
        <div key={field.name} className="bdc-detail-item">
          <div className="bdc-detail-icon">
            {fieldIcons[field.type] || <FaMapMarkerAlt />}
          </div>
          <div className="bdc-detail-content">
            <span className="bdc-detail-label">{field.label}</span>
            <span className="bdc-detail-value">{displayValue}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="bdc-card"
      style={{ "--status-color": currentStatus.color, "--status-bg": currentStatus.bg, "--status-border": currentStatus.border }}
    >
      {/* Colored top accent */}
      <div className="bdc-accent" />

      {/* Header */}
      <div className="bdc-header">
        <div className="bdc-header-info">
          <h4 className="bdc-title">{booking.serviceTitle}</h4>
          <span className="bdc-booking-id">#{booking.id?.slice(-6)}</span>
        </div>
        <div
          className="bdc-status-badge"
          style={{ background: currentStatus.bg, color: currentStatus.color, borderColor: currentStatus.border }}
        >
          <span className="bdc-status-icon">{currentStatus.icon}</span>
          {currentStatus.label}
        </div>
      </div>

      {/* Category chip */}
      <div className="bdc-category-chip">
        <span className="bdc-category-dot" />
        {config.name}
      </div>

      {/* Details grid */}
      <div className="bdc-details">
        {renderDynamicFields()}

        <div className="bdc-detail-item">
          <div className="bdc-detail-icon"><FaEnvelope /></div>
          <div className="bdc-detail-content">
            <span className="bdc-detail-label">Contact Email</span>
            <span className="bdc-detail-value">{booking.contactEmail}</span>
          </div>
        </div>

        <div className="bdc-detail-item">
          <div className="bdc-detail-icon"><FaPhone /></div>
          <div className="bdc-detail-content">
            <span className="bdc-detail-label">Contact Phone</span>
            <span className="bdc-detail-value">{booking.contactPhone}</span>
          </div>
        </div>

        <div className="bdc-detail-item">
          <div className="bdc-detail-icon"><FaUser /></div>
          <div className="bdc-detail-content">
            <span className="bdc-detail-label">Traveller</span>
            <span className="bdc-detail-value">{booking.travellerName}</span>
          </div>
        </div>

        <div className="bdc-detail-item">
          <div className="bdc-detail-icon"><FaCalendarAlt /></div>
          <div className="bdc-detail-content">
            <span className="bdc-detail-label">Booked On</span>
            <span className="bdc-detail-value">{formatDate(booking.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {booking.message && (
        <div className="bdc-message">
          <p className="bdc-message-label">💬 Message</p>
          <p className="bdc-message-text">{booking.message}</p>
        </div>
      )}

      {/* Provider Actions */}
      {isProvider && (
        <div className="bdc-actions">
          <div className="bdc-status-control">
            <label className="bdc-status-label">Status</label>
            <div className="bdc-select-wrapper">
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="bdc-status-select"
              >
                <option value="PENDING">⏳ Pending</option>
                <option value="CONFIRMED">✓ Confirmed</option>
                <option value="COMPLETED">★ Completed</option>
                <option value="CANCELLED">✕ Cancelled</option>
              </select>
              <FaChevronDown className="bdc-select-arrow" />
            </div>
          </div>
          <button
            className="bdc-btn bdc-btn-delete"
            onClick={() => onDeleteBooking(booking.id)}
            disabled={isUpdating}
          >
            <FaTrashAlt /> Delete
          </button>
        </div>
      )}

      {/* Traveller Actions */}
      {!isProvider && (onViewPost || onCancelBooking || onRemoveBooking) && (
        <div className="bdc-actions bdc-actions-traveller">
          {onViewPost && booking.serviceId && (
            <button
              type="button"
              className="bdc-btn bdc-btn-view"
              onClick={() => onViewPost(booking.serviceId)}
              disabled={isUpdating}
            >
              <FaExternalLinkAlt /> View Post
            </button>
          )}
          {onCancelBooking && String(booking.status).toUpperCase() === "PENDING" && (
            <button
              type="button"
              className="bdc-btn bdc-btn-cancel"
              onClick={handleCancelAsTraveller}
              disabled={isUpdating}
            >
              <FaTimesCircle /> Cancel
            </button>
          )}
          {onRemoveBooking && ["CANCELLED", "COMPLETED"].includes(String(booking.status).toUpperCase()) && (
            <button
              type="button"
              className="bdc-btn bdc-btn-remove"
              onClick={() => onRemoveBooking(booking.id)}
              disabled={isUpdating}
            >
              <FaTrashAlt /> Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
