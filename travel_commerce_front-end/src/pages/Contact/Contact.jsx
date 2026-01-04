import React, { useState } from "react";
import Navbar from "../../components/Navbar";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "Traveller",
        message: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Message sent! (Demo Only)");
        setFormData({ name: "", email: "", role: "Traveller", message: "" });
    };

    return (
        <div className="contact-page py-5 bg-light min-vh-100 d-flex align-items-center">
            <Navbar />
            <div className="container">
                <div className="row g-5 align-items-center">

                    {/* Left Column: Get in Touch */}
                    <div className="col-md-6 order-2 order-md-1 text-center text-md-start">
                        <h1 className="display-4 fw-bold mb-3" style={{ color: "#2c3e50" }}>
                            Get in Touch
                        </h1>
                        <p className="lead text-muted mb-5">
                            We are here to help you navigate Sri Lanka and ensuring you have
                            a safe and authentic experience.
                        </p>

                        <div className="d-flex flex-column gap-4 justify-content-center justify-content-md-start">
                            {/* Hotline */}
                            <div className="d-flex align-items-start gap-3">
                                <div className="text-primary fs-3">📞</div>
                                <div>
                                    <h5 className="fw-bold mb-1">Hotline</h5>
                                    <p className="text-muted mb-0">+94 77 123 4567</p>
                                    <a href="#" className="btn btn-sm btn-success mt-2 rounded-pill px-3">
                                        <i className="bi bi-whatsapp me-2"></i>Whatsapp
                                    </a>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="d-flex align-items-start gap-3">
                                <div className="text-primary fs-3">✉️</div>
                                <div>
                                    <h5 className="fw-bold mb-1">Email</h5>
                                    <p className="text-muted mb-0">support@travelcommerce.com</p>
                                </div>
                            </div>

                            {/* Office */}
                            <div className="d-flex align-items-start gap-3">
                                <div className="text-primary fs-3">📍</div>
                                <div>
                                    <h5 className="fw-bold mb-1">Office</h5>
                                    <p className="text-muted mb-0">Colombo 03, Sri Lanka</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 p-3 rounded bg-white shadow-sm border-start border-4 border-success d-inline-block">
                            <p className="mb-0 fw-semibold text-success">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Support available 24/7 for travelers
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Contact Form */}
                    <div className="col-md-6 order-1 order-md-2">
                        <div className="card border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                            <div className="card-body p-4 p-md-5">
                                <h3 className="fw-bold mb-4 text-center" style={{ color: "#2c3e50" }}>
                                    Send us a Message
                                </h3>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label fw-semibold">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Your Full Name"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
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

                                    <div className="mb-3">
                                        <label htmlFor="role" className="form-label fw-semibold">I am a</label>
                                        <select
                                            className="form-select"
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                        >
                                            <option value="Traveller">Traveler</option>
                                            <option value="Provider">Service Provider</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="message" className="form-label fw-semibold">Message</label>
                                        <textarea
                                            className="form-control"
                                            id="message"
                                            name="message"
                                            rows="4"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="How can we help you?"
                                            required
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn w-100 text-white fw-bold py-2 rounded-pill shadow-sm"
                                        style={{ background: "#2c3e50" }}
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
