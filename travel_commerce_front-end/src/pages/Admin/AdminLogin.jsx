// src/pages/Admin/AdminLogin.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar"; 
import Footer from "../../components/Footer";
// Assuming Login.css is available and provides styles for forms/buttons
import "../../styles/Login.css"; 

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    
    const nav = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        // 🚨 TO-DO: Call your Admin-specific login API endpoint: authApi.adminLogin({ email, password })
        
        try {
            // Mocking a successful login for demonstration
            if (email === "admin@travel.lk" && password === "securepass") {
                // In a real app, JWT token and user object are set here
                // For now, redirect immediately
                setTimeout(() => {
                    nav("/admin/dashboard");
                }, 1000);
            } else {
                setErr("Invalid Admin Credentials");
            }
        } catch (error) {
            setErr(error?.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <div className="main-content">
                <div className="container page login-container admin-login-container">
                    <h2 className="login-title">Admin Login</h2>
                    <p className="login-subtitle">Access the Travel Commerce Management Console</p>

                    <form onSubmit={handleSubmit} className="form-login">

                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter admin email"
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />

                        <button className="btn admin-btn" type="submit" disabled={loading}>
                            {loading ? "Verifying..." : "Login as Admin"}
                        </button>

                        {err && <p className="error-msg">{err}</p>}
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}