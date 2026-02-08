import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import Navbar from "../../components/Navbar"; 
import Footer from "../../components/Footer";
import "../../styles/Login.css"; 

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    
    const nav = useNavigate();
    const toast = useToast();

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: email, 
                    password: password,
                    role: "ROLE_ADMIN"
                }),
            });

            const data = await response.json();
            
            // 🚨 DEBUG: Open your browser console (F12) to see this!
            console.log("LOGIN RESPONSE FROM SERVER:", data);

            if (response.ok) {
                // Check both possible locations for the role
                const userRole = data.role || (data.user && data.user.role);

                if (userRole === "ROLE_ADMIN") {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("role", userRole);
                    localStorage.setItem("user", JSON.stringify(data.user || data)); // Save user details
                    
                    toast.success("Admin login successful!");
                    window.location.href = "/admin/dashboard";
                } else {
                    toast.error(`Access Denied. You do not have admin privileges.`);
                    setErr(`Access Denied. Server says you are: ${userRole}`);
                }
            } else {
                toast.error(data.message || "Login failed. Please check your credentials.");
                setErr(data.message || "Login failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Server error. Please ensure the backend is running.");
            setErr("Server error. Check console for details.");
        } finally {
            setLoading(false);
        }
    }

    // async function handleSubmit(e) {
    //     e.preventDefault();
    //     setErr("");
    //     setLoading(true);

    //     try {
    //         // 🚨 REAL BACKEND CALL
    //         const response = await fetch("http://localhost:8080/api/auth/login", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ email, password }),
    //         });

    //         const data = await response.json();

    //         if (response.ok) {
    //             // Check if user is actually an ADMIN
    //             if (data.role === "ROLE_ADMIN") {
    //                 localStorage.setItem("token", data.token);
    //                 localStorage.setItem("role", data.role);
    //                 localStorage.setItem("user", JSON.stringify(data));
                    
    //                 // Redirect to Dashboard
    //                 nav("/admin/dashboard");
    //             } else {
    //                 setErr("Access Denied: You are not an Admin.");
    //             }
    //         } else {
    //             setErr(data.message || "Login failed");
    //         }
    //     } catch (error) {
    //         setErr("Server error. Is the backend running?");
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    return (
        <>
            <Navbar />
            <div className="main-content">
                <div className="container page login-container admin-login-container">
                    <h2 className="login-title">Admin Login</h2>
                    <p className="login-subtitle">Management Console</p>

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

                        {err && <p className="error-msg" style={{color: 'red', marginTop: '10px'}}>{err}</p>}
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}