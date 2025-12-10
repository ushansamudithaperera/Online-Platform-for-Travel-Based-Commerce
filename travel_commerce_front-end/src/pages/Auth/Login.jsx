import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Toast from "../../components/Toast";   // <-- Toast added
import "../../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("traveller");
  const [loading, setLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const nav = useNavigate();

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.login({ email, password, role });
      const { token, user } = res.data;

      login(user, token);

      // SUCCESS TOAST
      showToast("Login successful!", "success");

      // Redirect after slight delay
      setTimeout(() => {
        if (role === "traveller") nav("/traveller/dashboard");
        if (role === "provider") nav("/provider/dashboard");
      }, 800);

    } catch (error) {
      showToast(
        error?.response?.data?.message || "Login failed",
        "error"
      );
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />

      {/* TOAST DISPLAY */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
