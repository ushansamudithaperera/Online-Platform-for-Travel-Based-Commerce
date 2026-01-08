import api from "./axiosConfig";

export const toggleWishlist = (serviceId) => api.post(`/wishlist/toggle/${serviceId}`);
export const getWishlist = () => api.get("/wishlist");
export const getWishlistIds = () => api.get("/wishlist/ids");
