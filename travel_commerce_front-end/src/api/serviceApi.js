// src/api/serviceApi.js
import api from "./axiosConfig";

export const getAllServices = () => api.get("/services");
export const getServiceById = (id) => api.get(`/services/${id}`);

// ✅ IMPORTANT: explicitly send multipart/form-data
export const createService = (formData) =>
  api.post("/services", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updateService = (id, payload) => api.put(`/services/${id}`, payload);
export const deleteService = (id) => api.delete(`/services/${id}`);

// For Provider Dashboard
export const getProviderServices = () => api.get("/services/provider-posts");