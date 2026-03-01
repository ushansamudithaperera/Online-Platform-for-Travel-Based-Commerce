import React, { useState, useEffect } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/AuthModal.css";
import "../../styles/Login.css";

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("traveller");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [countryCodes, setCountryCodes] = useState([]);
  const [telephone, setTelephone] = useState({ code: "", number: "" });
  const nav = useNavigate();

  useEffect(() => {
    async function loadCodes() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all");
        const data = await res.json();
        const codes = data
          .map((c) => ({
            code: c.idd?.root && c.idd?.suffixes ? c.idd.root + c.idd.suffixes[0] : "",
            name: c.name.common,
          }))
          .filter((c) => c.code);
        setCountryCodes(codes);
      } catch {
        setCountryCodes([{ code: "+94", name: "Sri Lanka" }]);
      }
    }
    loadCodes();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (!telephone.code) {
      setErr("Please select a country code.");
      return;
    }
    if (!telephone.number) {
      setErr("Please enter your contact number.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        fullname,
        email,
        telephone: telephone.code + telephone.number,
        password,
        role,
      });
      if (res.data?.success) {
        toast.success("Registration successful! Redirecting...");
        setTimeout(() => {
          nav("/login");
        }, 1500);
      } else {
        toast.error("Registration failed");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registration failed"
      );
    }
    setLoading(false);
  }

  return (
    <>
      <div className="auth-modal-bg">
        <div className="auth-modal-card">
          <h2 className="login-title">Register</h2>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
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
            <div className="form-field full-width">
              <label>Contact Number</label>
              <div className="contact-number-group">
                <select
                  value={telephone.code}
                  onChange={(e) => setTelephone({ ...telephone, code: e.target.value })}
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={telephone.number}
                  onChange={(e) =>
                    setTelephone({
                      ...telephone,
                      number: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="Enter contact number"
                  maxLength="12"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <span
                  className="show-hide-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <div className="form-field">
              <label>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
                <span
                  className="show-hide-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <div className="form-field full-width">
              <label>Register as:</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="traveller">Traveller</option>
                <option value="provider">Provider</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
            {err && <p className="error-msg">{err}</p>}
          </form>
          {/* Google Sign Up Button */}
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                // Include the selected role so new users get the correct role assigned
                fetch('http://localhost:8080/api/oauth2/callback/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: credentialResponse.credential, role: role })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data && data.token && data.user) {
                      toast.success('Google sign up successful!');
                      nav('/login');
                    } else {
                      toast.error('Google sign up failed: Invalid response');
                    }
                  })
                  .catch(() => toast.error('Google sign up failed'));
              }}
              onError={() => {
                toast.error('Google sign up failed');
              }}
            />
          </div>
          <p className="signup-text">
            Already have an account?{" "}
            <Link to="/login" className="signup-link">
              Login
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
