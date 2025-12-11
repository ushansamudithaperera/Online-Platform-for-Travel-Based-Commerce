import api from "./axiosConfig";

export const getAllServices = () => api.get("/services");
export const getServiceById = (id) => api.get(`/services/${id}`);
export const createService = (payload) => api.post("/services", payload);
export const updateService = (id, payload) => api.put(`/services/${id}`, payload);
export const deleteService = (id) => api.delete("/services/${id}");
// CRITICAL: New function for Provider Dashboard
export const getProviderServices = () => api.get("/services/provider-posts");