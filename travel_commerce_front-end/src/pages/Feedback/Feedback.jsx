import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useToast } from "../../context/ToastContext";

export default function Feedback() {
    const toast = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        type: "Suggestion",
        rating: "5",
        message: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success("Thank you for your feedback!");
        setFormData({ name: "", email: "", type: "Suggestion", rating: "5", message: "" });
    };

    return (
        <div className="feedback-page d-flex flex-column min-vh-100">
            <Navbar />

            <div className="flex-grow-1 bg-light py-5">
                <div className="container">
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
                                                >
                                                    Submit Feedback
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
