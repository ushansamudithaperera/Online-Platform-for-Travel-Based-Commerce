import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

export default function About() {
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

      {/* 3. Why Choose Us? (Values Grid) */}
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

      {/* 4. The Team / Story */}
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

      {/* 5. Call to Action (Footer) */}
      <section className="py-5 text-center text-white" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container">
          <h2 className="mb-3">Ready to start your journey?</h2>
          <p className="mb-4 text-white-50">Join our community today as a traveler or a service provider.</p>
          <Link to="/register" className="btn btn-lg btn-primary px-5 rounded-pill shadow">
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
}
