 

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate} from "react-router-dom";
 
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

 
  // Scroll to services when clicking a category
  // Scroll to services when clicking a category
  const handleCategoryClick = () => {
    navigate("/services");
  };
 

  /* ---------------- ANIMATION LOGIC ---------------- */
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
    <>
      <Navbar />

 
      {/* ---------------- HERO SECTION ---------------- */}
      <section style={styles.heroSection}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.ayubowanText}>
            {text}<span style={styles.cursor}>|</span>
          </h1>
          <h2 style={styles.subText}>Experience the Pearl of the Indian Ocean</h2>
          <p style={styles.introText}>
            Connect with verified local guides, drivers, and hosts for an authentic Sri Lankan journey.
          </p>
        </div>
      </section>
 

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
 

/* ---------------- INLINE STYLES ---------------- */
const styles = {
  pageContainer: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "#333",
    backgroundColor: "#fcfcfc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  heroSection: {
    position: "relative",
    height: "85vh",
    width: "100%",
    backgroundImage: `url(${heroBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#fff",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)", // Subtle dark overlay
    zIndex: 1,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "800px",
    padding: "20px",
  },
  ayubowanText: {
    fontSize: "4rem",
    fontWeight: "300",
    marginBottom: "10px",
    letterSpacing: "2px",
    fontFamily: "Georgia, serif", // More elegant font for greeting
    minHeight: "90px", // prevent layout shift
  },
  cursor: {
    color: "#fff",
    animation: "blink 1s step-end infinite",
    fontWeight: "100",
  },
  subText: {
    fontSize: "1.8rem",
    fontWeight: "400",
    marginBottom: "20px",
    opacity: "0.95",
  },
  introText: {
    fontSize: "1.1rem",
    lineHeight: "1.6",
    opacity: "0.9",
    maxWidth: "600px",
    margin: "0 auto",
  },
  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    width: "100%",
    transform: "translateY(-60px)", // Overlap hero slightly
    position: "relative",
    zIndex: 10,
  },
  splitSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
    marginBottom: "80px",
  },
  splitCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease",
    display: "flex",
    flexDirection: "column",
    height: "500px",
  },
  cardImage: {
    height: "60%",
    width: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  cardOverlay: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 100%)",
  },
  cardContent: {
    padding: "30px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: "1.8rem",
    color: "#2a004f", // Deep purple from original palette
    marginBottom: "10px",
    fontWeight: "600",
  },
  cardDesc: {
    color: "#666",
    marginBottom: "25px",
    lineHeight: "1.5",
  },
  primaryBtn: {
    display: "inline-block",
    padding: "12px 30px",
    backgroundColor: "#2a004f", // Deep purple
    color: "#fff",
    borderRadius: "50px",
    textDecoration: "none",
    fontWeight: "600",
    transition: "background 0.3s",
    border: "2px solid #2a004f",
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "12px 30px",
    backgroundColor: "#fff",
    color: "#2a004f",
    borderRadius: "50px",
    textDecoration: "none",
    fontWeight: "600",
    border: "2px solid #2a004f",
    transition: "all 0.3s",
  },
  categorySection: {
    textAlign: "center",
    marginBottom: "80px",
    paddingTop: "20px",
  },
  sectionTitle: {
    fontSize: "2rem",
    color: "#333",
    marginBottom: "10px",
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: "#777",
    marginBottom: "40px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  categoryCard: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "transform 0.2s",
    border: "1px solid #eee",
  },
  iconBox: {
    fontSize: "3rem",
    marginBottom: "15px",
  },
  catName: {
    fontSize: "1.1rem",
    color: "#444",
    fontWeight: "600",
  },
  trustSection: {
    backgroundColor: "#f9f9f9",
    borderRadius: "16px",
    padding: "50px",
    marginBottom: "60px",
    textAlign: "center",
  },
  trustGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px",
  },
  trustItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  checkIcon: {
    color: "#2a004f",
    fontSize: "1.5rem",
    marginBottom: "15px",
    backgroundColor: "#eaddff",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#333",
  },
  trustDesc: {
    color: "#666",
    fontSize: "0.95rem",
    lineHeight: "1.5",
  },
};
 
