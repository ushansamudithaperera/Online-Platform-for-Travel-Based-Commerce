// src/api/serviceApi.js
import api from "./axiosConfig";

export const getAllServices = () => api.get("/services");
export const getServiceById = (id) => api.get(`/services/${id}`);

// CREATE: FormData with images
export const createService = (formData) =>
  api.post("/services", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// UPDATE: supports both JSON and FormData
export const updateService = (id, payload) => {
  if (payload instanceof FormData) {
    // edit with images
    return api.put(`/services/${id}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
  // simple JSON edit (if used elsewhere)
  return api.put(`/services/${id}`, payload);
};

export const deleteService = (id) => api.delete(`/services/${id}`);

export const getProviderServices = () => api.get("/services/provider-posts");