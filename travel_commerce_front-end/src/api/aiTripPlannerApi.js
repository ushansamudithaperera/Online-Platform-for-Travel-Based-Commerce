import api from "./axiosConfig";

export const generateTripPlan = ({ userQuery, numDays }) =>
  api.post("/ai/trip-plan", { userQuery, numDays });
