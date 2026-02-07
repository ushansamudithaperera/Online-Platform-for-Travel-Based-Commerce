import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

export default function Feedback() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        type: "Suggestion",
        rating: "5",
        message: ""
    });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.fullname || user.name || "",
                email: user.email || ""
            }));
            setShowLoginPrompt(false);
        } else {
            setShowLoginPrompt(true);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: "", message: "" });

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json"
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await axios.post("http://localhost:8080/api/feedback", formData, { headers });

            setStatus({ type: "success", message: "Thank you for your feedback!" });
            // Reset form but keep user details if logged in
            setFormData({
                name: user ? (user.fullname || user.name || "") : "",
                email: user ? (user.email || "") : "",
                type: "Suggestion",
                rating: "5",
                message: ""
            });
        } catch (error) {
            console.error("Feedback error:", error);
            setStatus({
                type: "error",
                message: error.response?.data?.message || "Something went wrong. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-page d-flex flex-column min-vh-100 position-relative">
            <Navbar />

            {/* Login Prompt Overlay */}
            {showLoginPrompt && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                        zIndex: 2000,
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(12px)",
                        transition: "all 0.3s ease"
                    }}
                >
                    <div className="card border-0 shadow-lg text-center p-4 rounded-4 animate__animated animate__fadeInUp" style={{ maxWidth: "420px", width: "90%" }}>
                        <div className="mb-3">
                            <i className="bi bi-person-lock" style={{ fontSize: "3rem", color: "#2a004f" }}></i>
                        </div>
                        <h3 className="fw-bold mb-2">Login Required</h3>
                        <p className="text-muted mb-4 small">
                            Please sign in to your account to share your feedback with us. It helps us provide better support.
                        </p>
                        <div className="d-grid gap-2">
                            <button
                                className="btn btn-lg text-white rounded-pill shadow-sm py-2 fs-6"
                                style={{ backgroundColor: "#2a004f", border: "none" }}
                                onClick={() => navigate("/login")}
                            >
                                Login Now
                            </button>
                            <button
                                className="btn btn-outline-secondary rounded-pill py-2 fs-6"
                                onClick={() => navigate("/register")}
                            >
                                Create an Account
                            </button>
                            <button
                                className="btn btn-sm btn-link text-decoration-none text-muted mt-2"
                                onClick={() => navigate("/")}
                            >
                                Not now, go back home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-grow-1 bg-light py-5 ${showLoginPrompt ? 'overflow-hidden' : ''}`} style={showLoginPrompt ? { maxHeight: '100vh' } : {}}>
                <div className="container" style={showLoginPrompt ? { filter: 'blur(4px)', pointerEvents: 'none' } : {}}>
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="text-center mb-5">
                                <h1 className="display-4 fw-bold" style={{ color: "#2c3e50" }}>We Value Your Feedback</h1>
                                <p className="lead text-muted">
                                    Help us improve your experience. Whether it's a suggestion, a compliment, or an issue, we want to hear from you.
                                </p>
                            </div>

                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="card-body p-5">
                                    {status.message && (
                                        <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} mb-4`} role="alert">
                                            {status.message}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">

                                            {/* Name */}
                                            <div className="col-md-6">
                                                <label htmlFor="name" className="form-label fw-semibold">Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Your Name"
                                                    required
                                                    disabled={!!user}
                                                    readOnly={!!user}
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="col-md-6">
                                                <label htmlFor="email" className="form-label fw-semibold">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="name@example.com"
                                                    required
                                                    disabled={!!user}
                                                    readOnly={!!user}
                                                />
                                            </div>

                                            {/* Type of Feedback */}
                                            <div className="col-md-6">
                                                <label htmlFor="type" className="form-label fw-semibold">Feedback Type</label>
                                                <select
                                                    className="form-select"
                                                    id="type"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Suggestion">Suggestion</option>
                                                    <option value="Compliment">Compliment</option>
                                                    <option value="Issue">Report an Issue</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            {/* Rating */}
                                            <div className="col-md-6">
                                                <label htmlFor="rating" className="form-label fw-semibold">Rating</label>
                                                <select
                                                    className="form-select"
                                                    id="rating"
                                                    name="rating"
                                                    value={formData.rating}
                                                    onChange={handleChange}
                                                >
                                                    <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                                                    <option value="4">⭐⭐⭐⭐ - Very Good</option>
                                                    <option value="3">⭐⭐⭐ - Good</option>
                                                    <option value="2">⭐⭐ - Fair</option>
                                                    <option value="1">⭐ - Poor</option>
                                                </select>
                                            </div>

                                            {/* Message */}
                                            <div className="col-12">
                                                <label htmlFor="message" className="form-label fw-semibold">Your Message</label>
                                                <textarea
                                                    className="form-control"
                                                    id="message"
                                                    name="message"
                                                    rows="5"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    placeholder="Tell us more..."
                                                    required
                                                ></textarea>
                                            </div>

                                            {/* Submit Button */}
                                            <div className="col-12 text-center mt-4">
                                                <button
                                                    type="submit"
                                                    className="btn btn-lg text-white rounded-pill px-5 shadow-sm"
                                                    style={{ backgroundColor: "#2a004f" }}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                                                </button>
                                            </div>

                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Contact Info Snippet */}
                            <div className="text-center mt-5 text-muted">
                                <p>
                                    Need immediate assistance? Visit our <a href="/contact" className="text-decoration-none">Contact Page</a> or call our hotline.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
