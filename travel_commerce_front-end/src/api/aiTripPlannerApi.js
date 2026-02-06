import api from "./axiosConfig";

export const generateTripPlan = ({ userQuery, numDays }) =>
  api.post("/ai/trip-plan", { userQuery, numDays });

export const aiSmartSearch = ({ searchQuery, availablePosts }) =>
  api.post("/ai/smart-search", { searchQuery, availablePosts });
