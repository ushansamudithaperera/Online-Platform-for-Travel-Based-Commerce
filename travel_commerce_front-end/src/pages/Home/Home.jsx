

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./Home.css"; // Import the new CSS file

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

/* ---------------- NEW DATA: DESTINATIONS ---------------- */
import sigiriyaImg from "../../assets/sigiriya.jpg";
import ellaImg from "../../assets/ella.jpg";
import galleImg from "../../assets/galle_fort.jpg";
import mirissaImg from "../../assets/mirissa.jpg";
import teaImg from "../../assets/tea.jpg";
import seaImg from "../../assets/sea.jpg";

const destinations = [
  { img: sigiriyaImg, name: "Sigiriya", desc: "The Ancient Rock Fortress" },
  { img: ellaImg, name: "Ella", desc: "Misty Mountains & Tea" },
  { img: galleImg, name: "Galle Fort", desc: "Colonial Charm by the Sea" },
  { img: mirissaImg, name: "Mirissa", desc: "Whales & Golden Beaches" },
];

export default function Home() {
  const [currentHero, setCurrentHero] = useState(0);
  const [providerIndex, setProviderIndex] = useState(0);
  const [travellerIndex, setTravellerIndex] = useState(0);

  const providerTimer = useRef(null);
  const travellerTimer = useRef(null);
  const navigate = useNavigate();

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
      { threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ---------------- TYPEWRITER ---------------- */
  const txts = ["Ayubowan", "ආයුබෝවන්"];
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % txts.length;
      const fullText = txts[i];

      setText(isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1)
      );

      // Typing Speed
      setTypingSpeed(isDeleting ? 80 : 150);

      if (!isDeleting && text === fullText) {
        // Full word typed, pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
        setTypingSpeed(2000); // pause duration
      } else if (isDeleting && text === "") {
        // Fully deleted, move to next word
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, txts]);

  return (
    <div className="home-container">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        {heroImages.map((img, i) => (
          <img
            key={i}
            src={img}
            className={`hero-img ${i === currentHero ? "active" : ""}`}
            alt="" />
        ))}

        <div className="hero-content">
          <h1 className="ayubowan-text">
            {text}<span className="cursor">|</span>
          </h1>
          <h2 className="sub-text">Experience the Pearl of the Indian Ocean</h2>
          <p className="intro-text">
            Travel Commerce bridges the gap between service providers and travellers seeking authentic Sri Lankan experiences.
            Connect with verified local guides, drivers, and hosts for a journey you'll never forget.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn-hero btn-primary">Register</Link>
            <Link to="/login" className="btn-hero btn-outline">Login</Link>
          </div>
        </div>

        <div className="hero-dots">
          {heroImages.map((_, i) => (
            <span
              key={i}
              className={`hero-dot ${i === currentHero ? "active" : ""}`}
              onClick={() => setCurrentHero(i)} />
          ))}
        </div>
      </section>

      {/* ---------------- NEW: MUST VISIT DESTINATIONS ---------------- */}
      <section className="destinations-section scroll-appear">
        <h2 className="section-title">Must Visit Destinations</h2>
        <p className="section-description">
          Discover the breathtaking beauty of Sri Lanka, from ancient rock fortresses to pristine beaches.
        </p>

        <div className="destinations-grid">
          {destinations.map((dest, i) => (
            <div className="destination-card" key={i} onClick={() => navigate("/services")}>
              <img src={dest.img} alt={dest.name} className="dest-img" />
              <div className="dest-overlay">
                <h3 className="dest-name">{dest.name}</h3>
                <p className="dest-desc">{dest.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- NEW: CULTURAL EXPERIENCES ---------------- */}
      <section className="culture-section scroll-appear">
        <div className="culture-content">
          <div className="culture-text">
            <h2 className="section-title" style={{ textAlign: "left", margin: 0 }}>Experience the Culture</h2>
            <div style={{ width: "60px", height: "4px", background: "#d4af37", borderRadius: "2px", margin: "10px 0 20px" }}></div>
            <p style={{ lineHeight: "1.8", color: "#555", fontSize: "1.05rem" }}>
              Sri Lanka is a land of rich history and vibrant traditions. Immerse yourself in the local way of life through our curated cultural experiences.
              Whether it's learning to cook traditional curries, witnessing a Kandyan dance performance, or exploring ancient temples,
              we connect you with authentic providers who share the heart of Sri Lanka.
            </p>
            <br />
            <Link to="/services" className="btn-hero btn-primary" style={{ display: "inline-block", fontSize: "0.9rem" }}>
              Explore Experiences
            </Link>
          </div>
          <div className="culture-image-grid">
            {/* Using placeholder images for culture that fit the theme */}
            <img src={teaImg} alt="Tea" className="culture-img" />
            <img src={seaImg} alt="Elephants" className="culture-img" />
            <img src="https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=1000&auto=format&fit=crop" alt="Dancer" className="culture-img large" />
          </div>
        </div>
      </section>

      {/* ---------------- KEY FEATURES ---------------- */}
      <section className="key-features scroll-appear">
        <h2 className="section-title">Why Choose Travel Commerce?</h2>
        <div className="features-grid">
          <div className="feature-box">
            <span className="feature-icon">✔</span>
            <h3 className="feature-title">Verified Providers</h3>
            <p>Only trusted and verified service providers for your peace of mind.</p>
          </div>
          <div className="feature-box">
            <span className="feature-icon">🔒</span>
            <h3 className="feature-title">Secure Bookings</h3>
            <p>Your bookings and payments are protected with top-tier security.</p>
          </div>
          <div className="feature-box">
            <span className="feature-icon">🌍</span>
            <h3 className="feature-title">All-in-One Platform</h3>
            <p>Everything you need: Guides, drivers, hotels & experiences.</p>
          </div>
        </div>
      </section>



      {/* ---------------- DUAL SLIDERS ---------------- */}
      <div className="bothslides">
        {/* PROVIDERS */}
        <div className="slider-box">
          <h3 className="slider-title providers">For Service Providers</h3>
          <div
            className="services-slider"
            onMouseEnter={() => (providerTimer.current = startAutoSlide(providerServices, setProviderIndex))}
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
                  onClick={() => setProviderIndex(i)} />
              ))}
            </div>
          </div>
        </div>

        {/* TRAVELLERS */}
        <div className="slider-box">
          <h3 className="slider-title travellers">For Travellers</h3>
          <div
            className="services-slider"
            onMouseEnter={() => (travellerTimer.current = startAutoSlide(travellerServices, setTravellerIndex))}
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
                  onClick={() => setTravellerIndex(i)} />
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

      <Footer />
    </div>
  );
}


