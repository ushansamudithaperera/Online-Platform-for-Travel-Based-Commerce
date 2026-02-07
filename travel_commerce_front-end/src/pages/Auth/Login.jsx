import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("traveller");
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const { login } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.login({ email, password, role });
      const { token, user } = res.data;

      login(user, token);

      // SUCCESS TOAST
      toast.success("Login successful!");

      // Redirect after slight delay
      setTimeout(() => {
        if (role === "traveller") nav("/traveller/dashboard");
        if (role === "provider") nav("/provider/dashboard");
      }, 800);

    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Login failed"
      );
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />

      <div className="main-content">
        <div className="container page login-container">

          <h2 className="login-title">Login</h2>

          <form onSubmit={handleSubmit} className="form-login">

            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />

            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <label>Login as:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="traveller">Traveller</option>
              <option value="provider">Provider</option>
            </select>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* SIGN UP LINK */}
          <p className="signup-text">
            Do not have an account?{" "}
            <Link to="/register" className="signup-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
