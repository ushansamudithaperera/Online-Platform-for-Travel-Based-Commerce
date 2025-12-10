import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import hero1 from "../../assets/home-bg1.png";
import hero2 from "../../assets/home-bg2.jpg";
import hero3 from "../../assets/home-bg3.jpg";

import service1 from "../../assets/service1.jpg";
import service2 from "../../assets/service2.png";

const heroImages = [hero1, hero2, hero3];
const services = [
  {
    img: service1,
    title: "Post Your Service for travellers",
    desc: "Add your service and reach thousands of travellers easily.",
  },
  {
    img: service2,
    title: "Explore Travelling Services",
    desc: "Find trusted local guides, hotels, and experiences.",
  },
];

export default function Home() {
  const [currentHero, setCurrentHero] = useState(0);

  // Slider states
  const [currentService1, setCurrentService1] = useState(0);
  const [currentService2, setCurrentService2] = useState(0);

  const slider1Ref = useRef(null);
  const slider2Ref = useRef(null);

  // Hero slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Slider hover handlers
  const startAutoSlide = (setCurrent) => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % services.length;
      setCurrent(i);
    }, 2000);
    return interval;
  };

  const handleMouseEnter1 = () => {
    setCurrentService1(0);
    slider1Ref.current = startAutoSlide(setCurrentService1);
  };
  const handleMouseLeave1 = () => {
    clearInterval(slider1Ref.current);
  };

  const handleMouseEnter2 = () => {
    setCurrentService2(0);
    slider2Ref.current = startAutoSlide(setCurrentService2);
  };
  const handleMouseLeave2 = () => {
    clearInterval(slider2Ref.current);
  };






  /*scrolling*/
  
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".scroll-appear");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // trigger only once
      }
    });
  }, { threshold: 0.2 }); // 20% of element visible

  elements.forEach(el => observer.observe(el));
});


/* ---------------- FIXED SCROLL ANIMATION ---------------- */
useEffect(() => {
  const elements = document.querySelectorAll(".scroll-appear");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  });

  elements.forEach(el => observer.observe(el));

  return () => observer.disconnect();
}, []);
/* --------------------------------------------------------- */

/*test*/ 
useEffect(() => {
  const elements = document.querySelectorAll(".scroll-appear p");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}, []);

/* test2*/
// Typewriter effect for "Our Services" paragraph
const fullText = `Travel Commerce bridges the gap between service providers and travellers seeking meaningful and reliable experiences. 
Whether you’re offering city tours, local rides, adventures, hotel stays, or unique travel activities, our platform 
helps you share them with ease. Travellers can explore verified services, compare experiences, and book confidently — 
all in one modern and seamless platform.`;

const [displayedText, setDisplayedText] = useState("");

// Start typewriter only when section appears
useEffect(() => {
  const ourServicesSection = document.querySelector(".our-services");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let index = 0;
          const timer = setInterval(() => {
            setDisplayedText((prev) => prev + fullText[index]);
            index++;
            if (index === fullText.length) clearInterval(timer);
          }, 20);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  if (ourServicesSection) observer.observe(ourServicesSection);

  return () => observer.disconnect();
}, []);
  /* end test*/
  



  return (
    <>
      <Navbar />
      <div className="main-content">
          <section className="hero">
          {heroImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Hero ${index}`}
              className={`hero-img ${index === currentHero ? "active" : ""}`}
            />
          ))}

          <div className="hero-content">
            <h1>Discover, Explore, Publish, and Book Trusted Travel Services</h1>
            <p>
              Connect with local tour guides, drivers, hotels and experience
              providers across Sri Lanka.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn1">
                Register
              </Link>
              <Link to="/login" className="btn1 outline">
                Login
              </Link>
            </div>
          </div>

          {/* Hero dots for manual change */}
          <div className="hero-dots">
            {heroImages.map((_, idx) => (
              <span
                key={idx}
                className={`hero-dot ${idx === currentHero ? "active" : ""}`}
                onClick={() => setCurrentHero(idx)}
              ></span>
            ))}
          </div>
        </section>

        <section className="container featured">

        {/* ---------------- KEY FEATURES SECTION ---------------- */}
<section className="key-features scroll-appear">
  <h2 className="section-title">Why Choose Travel Commerce?</h2>

  <div className="features-grid">
    <div className="feature-box">
      <h3>✔ Verified Providers</h3>
      <p>Only trusted and verified service providers appear on our platform.</p>
    </div>

    <div className="feature-box">
      <h3>✔ Secure Bookings</h3>
      <p>Your bookings and payments are protected with secure systems.</p>
    </div>

    <div className="feature-box">
      <h3>✔ Wide Range of Services</h3>
      <p>Guides, drivers, hotels, and unique experiences — all in one place.</p>
    </div>
  </div>
</section>

  
{/* ---------------- OUR SERVICES SECTION ---------------- */}
<section className="our-services scroll-appear">
  <h2 className="section-title">Our Services</h2>
  <p className="service-description">
    Travel Commerce bridges the gap between service providers and travellers seeking meaningful and reliable experiences. 
    Whether you’re offering city tours, local rides, adventures, hotel stays, or unique travel activities, our platform 
    helps you share them with ease. Travellers can explore verified services, compare experiences, and book confidently — 
    all in one modern and seamless platform.
  </p>
</section>

{/* ------------------------------------------------------------ */}

  <div className="bothslides">
    {/* Slider 1 */}
    <div className="slider-box">
      <h3 className="slider-title providers">For Service Providers</h3>
      <div
        className="services-slider"
        onMouseEnter={handleMouseEnter1}
        onMouseLeave={handleMouseLeave1}
      >
        {services.map((service, index) => (
          <div
            key={index}
            className={`service-card ${
              index === currentService1 ? "active" : "inactive"
            }`}
            style={{ backgroundImage: `url(${service.img})` }}
          >
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="dots">
          {services.map((_, idx) => (
            <span
              key={idx}
              className={idx === currentService1 ? "dot active" : "dot"}
              onClick={() => setCurrentService1(idx)}
            ></span>
          ))}
        </div>
      </div>
    </div>

    {/* Slider 2 */}
    <div className="slider-box">
      <h3 className="slider-title travellers">For Travellers</h3>
      <div
        className="services-slider"
        onMouseEnter={handleMouseEnter2}
        onMouseLeave={handleMouseLeave2}
      >
        {services.map((service, index) => (
          <div
            key={index}
            className={`service-card ${
              index === currentService2 ? "active" : "inactive"
            }`}
            style={{ backgroundImage: `url(${service.img})` }}
          >
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="dots">
          {services.map((_, idx) => (
            <span
              key={idx}
              className={idx === currentService2 ? "dot active" : "dot"}
              onClick={() => setCurrentService2(idx)}
            ></span>
          ))}
        </div>
      </div>
    </div>
  </div>


  {/* ---------------- HOW IT WORKS SECTION ---------------- */}
<section className="how-it-works scroll-appear">
  <h2 className="section-title">How It Works</h2>

  <div className="steps-grid">
    <div className="step-box">
      <span className="step-number">1</span>
      <h3>Create Your Account</h3>
      <p>Sign up as a traveller or service provider in minutes.</p>
    </div>

    <div className="step-box">
      <span className="step-number">2</span>
      <h3>Explore or Publish</h3>
      <p>Browse services or publish your own with easy tools.</p>
    </div>

    <div className="step-box">
      <span className="step-number">3</span>
      <h3>Book or Receive Bookings</h3>
      <p>Travellers book instantly and providers get verified leads.</p>
    </div>
  </div>
</section>




        </section>

      </div>
      



      <Footer />
    </>
  );
}
