import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar"; 
import Footer from "../../components/Footer";
import axios from "../../api/axiosConfig"; // 1. Use your configured Axios
import "../../styles/Login.css"; 

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const nav = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            // 🚨 2. Call the REAL Backend Login Endpoint
            // (Make sure this matches your Controller, e.g., /auth/login or /users/login)
            const response = await axios.post("/auth/login", { email, password });

            // 3. Extract Real Data from Response
            // Adjust these keys ('token', 'user', 'role') to match what your Java Backend sends!
            const { token, user } = response.data; 

            // 4. Verify Admin Role
            // The backend stores it as 'ROLE_ADMIN', so check for that
            if (user.role !== "ROLE_ADMIN") {
                setErr("Access Denied: This account is not an Admin.");
                setLoading(false);
                return;
            }

            // 5. Save Real Token to Context
            login(user, token); 
            
            // 6. Redirect
            nav("/admin/dashboard");

        } catch (error) {
            console.error("Login Error:", error);
            setErr(error?.response?.data?.message || "Invalid email or password");
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
                            {loading ? "Verifying..." : "Login"}
                        </button>

                        {err && <p className="error-msg">{err}</p>}
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}







































// // src/pages/Admin/AdminLogin.jsx
// import { useAuth } from "../../context/AuthContext"; //manually injecting an admin user 
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar"; 
// import Footer from "../../components/Footer";
// // Assuming Login.css is available and provides styles for forms/buttons
// import "../../styles/Login.css"; 

// export default function AdminLogin() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [err, setErr] = useState("");
//     const [loading, setLoading] = useState(false);
    
//     const { login } = useAuth(); // 2. Get the login function
//     const nav = useNavigate();

//     async function handleSubmit(e) {
//         e.preventDefault();
//         setErr("");
//         setLoading(true);

//         // 🚨 TO-DO: Call your Admin-specific login API endpoint: authApi.adminLogin({ email, password })
//         //bypasses the pproper login for demo purposes
//         // --- THE MISSING PART START ---
//         try {
//             // Mocking a successful login for demonstration
//             if (email === "admin@travel.lk" && password === "securepass") {
//                 // In a real app, JWT token and user object are set here
//                 // For now, redirect immediately
//                 const mockAdminUser = {
//                     name: "System Admin",
//                     email: "admin@travel.lk",
//                     role: "admin" // This must match the check in ProtectedRoute
//                 };
//                 const mockToken = "mock-jwt-token-12345";
                
//                 // Save to global state/localStorage
//                 login(mockAdminUser, mockToken); 
//                 // --- THE MISSING PART END ---

//                 setTimeout(() => {
//                     nav("/admin/dashboard");
//                 }, 1000);
//             } else {
//                 setErr("Invalid Admin Credentials");
//             }
//         } catch (error) {
//             setErr(error?.response?.data?.message || "Login failed");
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <>
//             <Navbar />
//             <div className="main-content">
//                 <div className="container page login-container admin-login-container">
//                     <h2 className="login-title">Admin Login</h2>
//                     <p className="login-subtitle">Access the Travel Commerce Management Console</p>

//                     <form onSubmit={handleSubmit} className="form-login">

//                         <label>Email</label>
//                         <input
//                             type="email"
//                             required
//                             value={email}
//                             onChange={e => setEmail(e.target.value)}
//                             placeholder="Enter admin email"
//                         />

//                         <label>Password</label>
//                         <input
//                             type="password"
//                             required
//                             value={password}
//                             onChange={e => setPassword(e.target.value)}
//                             placeholder="Enter password"
//                         />

//                         <button className="btn admin-btn" type="submit" disabled={loading}>
//                             {loading ? "Verifying..." : "Login as Admin"}
//                         </button>

//                         {err && <p className="error-msg">{err}</p>}
//                     </form>
//                 </div>
//             </div>
//             <Footer />
//         </>
//     );
// }


// //http://localhost:5173/admin/login