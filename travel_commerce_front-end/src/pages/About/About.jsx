import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axios from "axios";

export default function About() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/feedback/testimonials");
      setTestimonials(response.data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating);
  };

  return (
    <div className="about-page">
      <Navbar />
      {/* 1. Hero Section */}
      <section className="bg-light py-5 text-center px-3">
        <div className="container">
          <h1 className="display-4 fw-bold mb-3" style={{ color: "#2c3e50" }}>
            Connecting the World to the Heart of Sri Lanka
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "700px" }}>
            Ayubowan! We are a community-driven platform dedicated to connecting authentic
            Sri Lankan experiences with travelers who appreciate culture, nature, and genuine hospitality.
          </p>
        </div>
      </section>

      {/* 2. The Bridge Section (Travelers Vs Providers) */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            {/* Traveler Card */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 text-center" style={{ backgroundColor: "#fdfbf7" }}>
                <div className="card-body">
                  <h2 className="h4 card-title fw-bold mb-3" style={{ color: "#e67e22" }}>
                    For Travelers
                  </h2>
                  <h3 className="h5 text-dark mb-3">Explore with Confidence</h3>
                  <p className="card-text text-muted">
                    Discover hidden gems, reliable guides, and verified stays.
                    We prioritize safety and authenticity, ensuring your journey through
                    Sri Lanka is seamless and memorable.
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Card */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 text-center" style={{ backgroundColor: "#fdfbf7" }}>
                <div className="card-body">
                  <h2 className="h4 card-title fw-bold mb-3" style={{ color: "#27ae60" }}>
                    For Locals
                  </h2>
                  <h3 className="h5 text-dark mb-3">Empowering Communities</h3>
                  <p className="card-text text-muted">
                    We provide a platform for local guides, drivers, and hosts to showcase
                    their services directly to the world, ensuring fair income and
                    sustainable tourism growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Testimonials Section (Horizontal Scroll) */}
      {testimonials.length > 0 && (
        <section className="py-5" style={{ backgroundColor: "#fafafa", overflow: "hidden" }}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold" style={{ color: "#2c3e50" }}>What Our Travelers Say</h2>
              <p className="text-muted">Real stories from real explorers in Sri Lanka</p>
            </div>

            <div
              className="d-flex pb-4 testimonials-scroll"
              style={{
                overflowX: "auto",
                gap: "1.5rem",
                scrollbarWidth: "thin",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "1rem"
              }}
            >
              {testimonials.map((item, index) => (
                <div
                  key={item.id || index}
                  style={{ minWidth: "320px", maxWidth: "320px", flex: "0 0 auto" }}
                >
                  <div className="card h-100 border-0 shadow-sm rounded-4 hover-lift" style={{ transition: 'transform 0.3s ease' }}>
                    <div className="card-body p-4 text-center">
                      <div className="mb-3">
                        <span className="text-warning">{renderStars(item.rating)}</span>
                      </div>
                      <p className="card-text text-muted mb-4" style={{ fontStyle: 'italic', fontSize: '0.95rem' }}>
                        "{item.message}"
                      </p>
                      <div className="d-flex align-items-center justify-content-center">
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                          style={{ width: '40px', height: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}
                        >
                          {item.name ? item.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div className="text-start">
                          <h6 className="mb-0 fw-bold small">{item.name || "Guest Traveller"}</h6>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{item.type || "Reviewer"}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline CSS for hiding scrollbar if needed or styling it */}
            <style>{`
              .testimonials-scroll::-webkit-scrollbar {
                height: 6px;
              }
              .testimonials-scroll::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .testimonials-scroll::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 10px;
              }
              .testimonials-scroll::-webkit-scrollbar-thumb:hover {
                background: #2a004f;
              }
            `}</style>
          </div>
        </section>
      )}

      {/* 4. Why Choose Us? (Values Grid) */}
      <section className="bg-white py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Why Choose Us?</h2>
          </div>
          <div className="row g-4 text-center">
            {/* Value 1 */}
            <div className="col-md-4">
              <div className="p-3">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-shield-check"></i> {/* Placeholder for icon */}
                  🛡️
                </div>
                <h4 className="h5 fw-bold">Transparency</h4>
                <p className="text-muted small">
                  No hidden fees. Direct connection with service providers for clear communication and fair pricing.
                </p>
              </div>
            </div>
            {/* Value 2 */}
            <div className="col-md-4">
              <div className="p-3">
                <div className="display-4 text-danger mb-3">
                  <i className="bi bi-heart"></i>
                  🇱🇰
                </div>
                <h4 className="h5 fw-bold">Authentic Culture</h4>
                <p className="text-muted small">
                  Experience the true Sri Lanka. Our platform focuses on local, cultural, and immersive travel experiences.
                </p>
              </div>
            </div>
            {/* Value 3 */}
            <div className="col-md-4">
              <div className="p-3">
                <div className="display-4 text-success mb-3">
                  <i className="bi bi-check-circle"></i>
                  ✅
                </div>
                <h4 className="h5 fw-bold">Verified Providers</h4>
                <p className="text-muted small">
                  Every provider is vetted through our admin approval process to ensure safety and quality standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Our Story */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="fw-bold mb-4">Our Story</h2>
              <p className="text-muted mb-4">
                Born from a love for travel and a desire to uplift local communities,
                our platform started as a small initiative to bridge the gap between
                curious travelers and the warm-hearted people of Sri Lanka.
                Today, we are growing into a trusted marketplace for authentic adventures.
              </p>
              <div className="mt-4 p-4 border rounded bg-white shadow-sm d-inline-block">
                <h5 className="mb-0 text-dark">The Founding Team</h5>
                <small className="text-muted">Dedicated to Digital Tourism in Sri Lanka</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action (Footer) */}
      <section className="py-5 text-center text-white" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container">
          <h2 className="mb-3">Ready to start your journey?</h2>
          <p className="mb-4 text-white-50">Join our community today as a traveler or a service provider.</p>
          <Link to="/register" className="btn btn-lg btn-primary px-5 rounded-pill shadow">
            Join Now
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
