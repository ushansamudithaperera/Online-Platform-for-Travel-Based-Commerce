import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Toast from "../../components/Toast";          // <-- NEW
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

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [countryCodes, setCountryCodes] = useState([]);
  const [telephone, setTelephone] = useState({ code: "", number: "" });

  const nav = useNavigate();

  /** ------------------------------------------------------------------
   * HANDLE SUBMIT
   * ------------------------------------------------------------------ */
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
        // ✔ SHOW SUCCESS TOAST
        setToast({
          show: true,
          type: "success",
          message: "Registration successful! Redirecting...",
        });

        setTimeout(() => {
          nav("/login");
        }, 1500);

      } else {
        setToast({
          show: true,
          type: "error",
          message: "Registration failed",
        });
      }

    } catch (error) {
      setToast({
        show: true,
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed",
      });
    }

    setLoading(false);
  }

  /** ------------------------------------------------------------------
   * LOAD COUNTRY CODES
   * ------------------------------------------------------------------ */
  useEffect(() => {
    async function loadCodes() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,idd");
        const data = await res.json();

        const codes = data
          .map((c) => {
            if (!c.idd?.root || !c.idd.suffixes?.length) return null;
            const fullCode = c.idd.root + c.idd.suffixes[0];
            return {
              name: c.name.common,
              code: fullCode.startsWith("+") ? fullCode : "+" + fullCode,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountryCodes(codes);

        if (!telephone.code && codes.length > 0) {
          setTelephone((prev) => ({ ...prev, code: codes[0].code }));
        }
      } catch (err) {
        console.error(err);
        setErr("Failed to load country codes.");
      }
    }

    loadCodes();
  }, []);

  return (
    <>
      <Navbar />

      {/* TOAST */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="main-content">
        <div className="container page login-container">
          <h2 className="login-title">Register</h2>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name */}
            <label>Full Name</label>
            <input
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Enter your full name"
            />

            {/* Email */}
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />

            {/* Contact */}
            <label>Contact Number</label>
            <div className="contact-number-group">
              <select
                value={telephone.code}
                onChange={(e) =>
                  setTelephone({ ...telephone, code: e.target.value })
                }
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

            {/* Password */}
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

            {/* Confirm Password */}
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

            {/* Role */}
            <label>Register as:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="traveller">Traveller</option>
              <option value="provider">Provider</option>
            </select>

            {/* Submit */}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>

            {err && <p className="error-msg">{err}</p>}
          </form>

          <p className="signup-text">
            Already have an account?{" "}
            <Link to="/login" className="signup-link">
              Login
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
