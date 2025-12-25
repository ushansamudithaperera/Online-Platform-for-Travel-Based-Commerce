import api from "./axiosConfig";

export const getAllServices = () => api.get("/services");
export const getServiceById = (id) => api.get(`/services/${id}`);
export const createService = (payload) => api.post("/services", payload);
export const updateService = (id, payload) => api.put(`/services/${id}`, payload);
export const deleteService = (id) => api.delete("/services/${id}");
// CRITICAL: New function for Provider Dashboard
export const getProviderServices = () => api.get("/services/provider-posts");


// 🚨  NEW FUNCTION FOR THE SEARCH BAR 🚨
export const searchServices = (category, district) => {
    // Builds URL like: /services/search?category=Hotel&district=Kandy
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (district) params.append("district", district);
    // Calls: GET /api/services/search?category=Hotel&district=Kandy add other parameters later
    return axios.get(`/services/search?${params.toString()}`);
};