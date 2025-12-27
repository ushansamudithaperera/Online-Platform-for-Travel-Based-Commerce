import api from "./axiosConfig";

export const getAllServices = () => api.get("/services");
export const getServiceById = (id) => api.get(`/services/${id}`);

// UPDATE: Added headers to handle file uploads
// Ensure payload is the FormData object
export const createService = (formData) => api.post("/services", formData, {
    headers: {
        // Do NOT manually set Content-Type here; 
        // Let the browser set it with the correct boundary for FormData
        "Content-Type": "multipart/form-data" 
    }
});
export const updateService = (id, payload) => api.put(`/services/${id}`, payload);
export const deleteService = (id) => api.delete(`/services/${id}`); // Fixed backticks

// CRITICAL: New function for Provider Dashboard
export const getProviderServices = () => api.get("/services/provider-posts");