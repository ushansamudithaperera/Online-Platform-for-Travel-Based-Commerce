// src/api/travellerApi.js
import api from "./axiosConfig";

// Booking APIs
export const createBooking = (bookingData) => api.post("/bookings", bookingData);
export const getMyBookings = () => api.get("/bookings/my-bookings");
export const cancelBooking = (bookingId) => api.delete(`/bookings/${bookingId}`);

// Review APIs
export const createReview = (reviewData) => api.post("/reviews", reviewData);
export const getServiceReviews = (serviceId) => api.get(`/reviews/service/${serviceId}`);
export const getMyReviews = () => api.get("/reviews/my-reviews");
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
