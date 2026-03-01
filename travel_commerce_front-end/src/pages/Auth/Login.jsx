import React, { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/AuthModal.css";
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
      const backendMsg = error?.response?.data?.message || "Login failed";
      if (backendMsg.includes("role does not match")) {
        toast.error("Selected role does not match your account role. Please choose the correct role.");
      } else {
        toast.error(backendMsg);
      }
    }

    setLoading(false);
  }

  return (
    <>
      <div className="auth-modal-bg">
        <div className="auth-modal-card">
          <h2 className="login-title">Login</h2>
          <form onSubmit={handleSubmit} className="form-login">
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="form-field full-width">
              <label>Login as:</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="traveller">Traveller</option>
                <option value="provider">Provider</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {/* Google Login Button */}
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                // Send credentialResponse.credential (JWT) to your backend for verification
                // Include the selected role so new users get the correct role assigned
                fetch('http://localhost:8080/api/oauth2/callback/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: credentialResponse.credential, role: role })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data && data.token && data.user) {
                      login(data.user, data.token);
                      toast.success('Google login successful!');
                      if (data.user.role === 'ROLE_TRAVELLER' || data.user.role === 'traveller') {
                        nav('/traveller/dashboard');
                      } else if (data.user.role === 'ROLE_PROVIDER' || data.user.role === 'provider') {
                        nav('/provider/dashboard');
                      } else {
                        nav('/');
                      }
                    } else {
                      toast.error('Google login failed: Invalid response');
                    }
                  })
                  .catch(() => toast.error('Google login failed'));
              }}
              onError={() => {
                  toast.error('Google login failed');
                }}
            />
          </div>

          {/* SIGN UP LINK */}
          <p className="signup-text">
            Do not have an account?{" "}
            <Link to="/register" className="signup-link">
              Sign up
            </Link>
          </p>
          <p style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/" className="signup-link" style={{ color: '#764ba2', fontWeight: 500 }}>
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
