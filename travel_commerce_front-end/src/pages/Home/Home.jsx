import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ---------------- HERO IMAGES ---------------- */
import hero1 from "../../assets/home-bg1.png";
import hero2 from "../../assets/home-bg2.jpg";
import hero3 from "../../assets/home-bg3.jpg";
import hero4 from "../../assets/home-bg4.jpg";


/* ---------------- PROVIDER SLIDER IMAGES ---------------- */
import provider1 from "../../assets/provider-taxi.jpg";
import provider2 from "../../assets/provider-guide.jpg";
import provider3 from "../../assets/provider-hotel.jpg";
import provider4 from "../../assets/provider-experience.jpg";

/* ---------------- TRAVELLER SLIDER IMAGES ---------------- */
import traveller1 from "../../assets/traveller-explore.jpg";
import traveller2 from "../../assets/traveller-book.jpg";
import traveller3 from "../../assets/traveller-review.jpg";
import traveller4 from "../../assets/traveller-support.jpg";

/* ---------------- DATA ---------------- */
const heroImages = [hero1, hero2, hero3, hero4];

const providerServices = [
  {
    img: provider1,
    title: "Post Taxi & Driver Services",
    desc: "Publish your taxi or driver services and reach travellers instantly.",
  },
  {
    img: provider2,
    title: "Offer Travel Guidance",
    desc: "Share your local knowledge as a tour guide and grow your bookings.",
  },
  {
    img: provider3,
    title: "List Hotels & Accommodations",
    desc: "Promote hotels, guest houses, and stays with trusted visibility.",
  },
  {
    img: provider4,
    title: "Create Unique Experiences",
    desc: "Post adventures, activities, and experiences travellers love.",
  },
];

const travellerServices = [
  {
    img: traveller1,
    title: "Explore Various Services",
    desc: "Discover guides, drivers, hotels, and unique travel experiences.",
  },
  {
    img: traveller2,
    title: "Book Services Easily",
    desc: "Book trusted services with secure payments and confidence.",
  },
  {
    img: traveller3,
    title: "Give Feedback & Reviews",
    desc: "Rate services and help other travellers choose better.",
  },
  {
    img: traveller4,
    title: "Travel with Confidence",
    desc: "Choose verified providers and enjoy stress-free travel.",
  },
];

export default function Home() {
  const [currentHero, setCurrentHero] = useState(0);
  const [providerIndex, setProviderIndex] = useState(0);
  const [travellerIndex, setTravellerIndex] = useState(0);

  const providerTimer = useRef(null);
  const travellerTimer = useRef(null);

  /* ---------------- HERO SLIDER ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- AUTO SLIDER FUNCTION ---------------- */
  const startAutoSlide = (list, setIndex) =>
    setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 2500);

  /* ---------------- SCROLL ANIMATION ---------------- */
  useEffect(() => {
    const elements = document.querySelectorAll(".scroll-appear");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.2 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ---------------- TYPEWRITER ---------------- */
  const fullText = `Travel Commerce bridges the gap between service providers and travellers seeking meaningful and reliable experiences.
Whether you’re offering city tours, local rides, adventures, hotel stays, or unique travel activities, our platform
helps you share them with ease. Travellers can explore verified services, compare experiences, and book confidently all in one modern and seamless platform.`;

  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar />

      <div className="main-content">

        {/* ---------------- HERO ---------------- */}
        <section className="hero">
          {heroImages.map((img, i) => (
            <img
              key={i}
              src={img}
              className={`hero-img ${i === currentHero ? "active" : ""}`}
              alt=""
            />
          ))}

          <div className="hero-content">
            <h1>Discover, Explore, Publish & Book Travel Services</h1>
            <p>Connect with trusted service providers across Sri Lanka.</p>

            <div className="hero-actions">
              <Link to="/register" className="btn1">Register</Link>
              <Link to="/login" className="btn1 outline">Login</Link>
            </div>
          </div>

          <div className="hero-dots">
            {heroImages.map((_, i) => (
              <span
                key={i}
                className={`hero-dot ${i === currentHero ? "active" : ""}`}
                onClick={() => setCurrentHero(i)}
              />
            ))}
          </div>
        </section>

        {/* ---------------- KEY FEATURES ---------------- */}
        <section className="key-features scroll-appear">
          <h2 className="section-title">Why Choose Travel Commerce?</h2>

          <div className="features-grid">
            <div className="feature-box">
              <h3>✔ Verified Providers</h3>
              <p>Only trusted and verified service providers.</p>
            </div>
            <div className="feature-box">
              <h3>✔ Secure Bookings</h3>
              <p>Your bookings and payments are protected.</p>
            </div>
            <div className="feature-box">
              <h3>✔ All-in-One Platform</h3>
              <p>Guides, drivers, hotels & experiences.</p>
            </div>
          </div>
        </section>

        {/* ---------------- OUR SERVICES ---------------- */}
        <section className="our-services scroll-appear">
          <h2 className="section-title">Our Services</h2>
          <p className="service-description">{displayedText}</p>
        </section>

        {/* ---------------- DUAL SLIDERS ---------------- */}
        <div className="bothslides">

          {/* PROVIDERS */}
          <div className="slider-box">
            <h3 className="slider-title providers">For Service Providers</h3>

            <div
              className="services-slider"
              onMouseEnter={() =>
                (providerTimer.current = startAutoSlide(providerServices, setProviderIndex))
              }
              onMouseLeave={() => clearInterval(providerTimer.current)}
            >
              {providerServices.map((item, i) => (
                <div
                  key={i}
                  className={`service-card ${i === providerIndex ? "active" : "inactive"}`}
                  style={{ backgroundImage: `url(${item.img})` }}
                >
                  <div className="service-overlay" />
                  <div className="service-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="dots">
                {providerServices.map((_, i) => (
                  <span
                    key={i}
                    className={i === providerIndex ? "dot active" : "dot"}
                    onClick={() => setProviderIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* TRAVELLERS */}
          <div className="slider-box">
            <h3 className="slider-title travellers">For Travellers</h3>

            <div
              className="services-slider"
              onMouseEnter={() =>
                (travellerTimer.current = startAutoSlide(travellerServices, setTravellerIndex))
              }
              onMouseLeave={() => clearInterval(travellerTimer.current)}
            >
              {travellerServices.map((item, i) => (
                <div
                  key={i}
                  className={`service-card ${i === travellerIndex ? "active" : "inactive"}`}
                  style={{ backgroundImage: `url(${item.img})` }}
                >
                  <div className="service-overlay" />
                  <div className="service-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="dots">
                {travellerServices.map((_, i) => (
                  <span
                    key={i}
                    className={i === travellerIndex ? "dot active" : "dot"}
                    onClick={() => setTravellerIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section className="how-it-works scroll-appear">
          <h2 className="section-title">How It Works</h2>

          <div className="steps-grid">
            <div className="step-box">
              <span className="step-number">1</span>
              <h3>Create Account</h3>
              <p>Sign up as traveller or provider.</p>
            </div>
            <div className="step-box">
              <span className="step-number">2</span>
              <h3>Explore or Publish</h3>
              <p>Browse or publish services easily.</p>
            </div>
            <div className="step-box">
              <span className="step-number">3</span>
              <h3>Book & Connect</h3>
              <p>Secure bookings and communication.</p>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
}
