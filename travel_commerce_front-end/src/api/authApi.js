import axios from "./axiosConfig";

// authApi wraps login/register endpoints
const authApi = {
  register: (payload) => axios.post("/auth/register", payload),
  login:    (payload) => axios.post("/auth/login", payload),
  me:       () => axios.get("/auth/me")
};

export default authApi;
