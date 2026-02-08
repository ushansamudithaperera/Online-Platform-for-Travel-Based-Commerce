import axios from "./axiosConfig";

// Get all notifications for current user
export const getNotifications = () => axios.get("/notifications");

// Get unread notification count
export const getUnreadCount = () => axios.get("/notifications/unread-count");

// Mark a single notification as read
export const markAsRead = (id) => axios.put(`/notifications/${id}/read`);

// Mark all notifications as read
export const markAllAsRead = () => axios.put("/notifications/read-all");

// Delete a single notification
export const deleteNotification = (id) => axios.delete(`/notifications/${id}`);

// Clear all notifications
export const clearAllNotifications = () => axios.delete("/notifications/clear-all");

// Admin: Send notification to a specific user
export const adminSendNotification = (recipientId, message) =>
  axios.post("/notifications/admin/send", { recipientId, message });

// Admin: Broadcast notification to users (targetRole: "ALL", "ROLE_TRAVELLER", "ROLE_PROVIDER")
export const adminBroadcast = (message, targetRole = "ALL") =>
  axios.post("/notifications/admin/broadcast", { message, targetRole });
