// src/api/travellerApi.js
import api from "./axiosConfig";

// Booking APIs
export const createBooking = (bookingData) => api.post("/bookings", bookingData);
export const getMyBookings = () => api.get("/bookings/my-bookings");
export const getProviderBookings = () => api.get("/bookings/provider-bookings");
export const updateBookingStatus = (bookingId, status) => 
  api.put(`/bookings/${bookingId}/status`, { status });
export const cancelBooking = (bookingId) => api.delete(`/bookings/${bookingId}`);
export const deleteBooking = (bookingId) => api.delete(`/bookings/${bookingId}`);

// Review APIs
export const createReview = (reviewData) => api.post("/reviews", reviewData);
export const getServiceReviews = (serviceId) => api.get(`/reviews/service/${serviceId}`);
export const getMyReviews = () => api.get("/reviews/my-reviews");
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
export const createReply = (parentReviewId, replyData) => api.post(`/reviews/${parentReviewId}/reply`, replyData);
export const updateReview = (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData);
