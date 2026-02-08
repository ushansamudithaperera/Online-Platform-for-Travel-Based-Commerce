import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../api/notificationApi";
import "../styles/NotificationPanel.css";

/* ─── Icon map for notification types ─── */
const TYPE_ICONS = {
  BOOKING_NEW: "📥",
  BOOKING_CONFIRMED: "✅",
  BOOKING_COMPLETED: "🏁",
  BOOKING_CANCELLED: "❌",
  BOOKING_DELETED: "🗑️",
  REVIEW_NEW: "⭐",
  REVIEW_REPLY: "💬",
};

const TYPE_COLORS = {
  BOOKING_NEW: "#3b82f6",
  BOOKING_CONFIRMED: "#22c55e",
  BOOKING_COMPLETED: "#8b5cf6",
  BOOKING_CANCELLED: "#ef4444",
  BOOKING_DELETED: "#6b7280",
  REVIEW_NEW: "#f59e0b",
  REVIEW_REPLY: "#06b6d4",
};

/* ─── Time ago helper ─── */
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  /* ─── Fetch unread count (lightweight polling) ─── */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch {
      /* silently fail */
    }
  }, []);

  /* ─── Fetch full notifications list ─── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Poll unread count every 30s ─── */
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /* ─── When panel opens, load full list ─── */
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  /* ─── Close on outside click ─── */
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  /* ─── Handlers ─── */
  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="np-container" ref={panelRef}>
      {/* ─── Bell button ─── */}
      <button className="np-bell-btn" onClick={handleToggle} title="Notifications">
        <svg
          className="np-bell-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="np-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* ─── Dropdown panel ─── */}
      {isOpen && (
        <div className="np-dropdown">
          {/* Header */}
          <div className="np-header">
            <h3 className="np-title">
              Notifications
              {unreadCount > 0 && (
                <span className="np-unread-count">{unreadCount} new</span>
              )}
            </h3>
            <div className="np-header-actions">
              {unreadCount > 0 && (
                <button className="np-action-btn" onClick={handleMarkAllRead} title="Mark all as read">
                  ✓ Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button className="np-action-btn np-clear-btn" onClick={handleClearAll} title="Clear all">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="np-list">
            {loading && (
              <div className="np-empty">
                <div className="np-spinner" />
                <p>Loading...</p>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="np-empty">
                <span className="np-empty-icon">🔔</span>
                <p>No notifications yet</p>
                <span className="np-empty-sub">
                  You'll see booking and review updates here
                </span>
              </div>
            )}

            {!loading &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`np-item ${!n.read ? "np-unread" : ""}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div
                    className="np-item-icon"
                    style={{ background: TYPE_COLORS[n.type] || "#6b7280" }}
                  >
                    {TYPE_ICONS[n.type] || "🔔"}
                  </div>
                  <div className="np-item-content">
                    {n.senderName && <p className="np-item-sender"><strong>From:</strong> {n.senderName}</p>}
                    <p className="np-item-message">{n.message}</p>
                    <span className="np-item-time">{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && <div className="np-item-dot" />}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
