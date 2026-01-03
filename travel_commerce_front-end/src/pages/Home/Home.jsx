import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ---------------- ASSETS ---------------- */
import heroBg from "../../assets/home-bg2.jpg"; // Using a calm, scenic background
import travelImg from "../../assets/traveller-explore.jpg";
import providerImg from "../../assets/provider-guide.jpg";

/* ---------------- DATA ---------------- */
const categories = [
  { id: "tour_guide", name: "Tour Guides", icon: "🗺️" },
  { id: "driver", name: "Chauffeur Drivers", icon: "🚗" },
  { id: "hotel", name: "Hotels & Stays", icon: "🏨" },
  { id: "adventure", name: "Experiences", icon: "🏄‍♂️" },
];

export default function Home() {
  const navigate = useNavigate();

  // Scroll to services when clicking a category
  const handleCategoryClick = () => {
    navigate("/services");
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar />

      {/* ---------------- HERO SECTION ---------------- */}
      <section style={styles.heroSection}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.ayubowanText}>Ayubowan</h1>
          <h2 style={styles.subText}>Experience the Pearl of the Indian Ocean</h2>
          <p style={styles.introText}>
            Connect with verified local guides, drivers, and hosts for an authentic Sri Lankan journey.
          </p>
        </div>
      </section>

      <div style={styles.mainContent}>

        {/* ---------------- DUAL CTA (SPLIT) ---------------- */}
        <section style={styles.splitSection}>

          {/* Traveler Card */}
          <div style={styles.splitCard}>
            <div style={{ ...styles.cardImage, backgroundImage: `url(${travelImg})` }}>
              <div style={styles.cardOverlay}></div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>I am a Traveler</h3>
              <p style={styles.cardDesc}>
                Discover hidden gems, book trusted drivers, and find the perfect stay.
              </p>
              <Link to="/register" style={styles.primaryBtn}>
                Plan My Trip
              </Link>
            </div>
          </div>

          {/* Provider Card */}
          <div style={styles.splitCard}>
            <div style={{ ...styles.cardImage, backgroundImage: `url(${providerImg})` }}>
              <div style={styles.cardOverlay}></div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>I am a Service Provider</h3>
              <p style={styles.cardDesc}>
                List your services, grow your business, and meet travelers from around the world.
              </p>
              <Link to="/register" style={styles.secondaryBtn}>
                List My Services
              </Link>
            </div>
          </div>

        </section>

        {/* ---------------- BROWSE CATEGORIES ---------------- */}
        <section style={styles.categorySection}>
          <h3 style={styles.sectionTitle}>Explore Our Services</h3>
          <p style={styles.sectionSubtitle}>Everything you need for a perfect holiday</p>

          <div style={styles.gridContainer}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={styles.categoryCard}
                onClick={handleCategoryClick}
                className="hover-card" // Keeping a class for simple hover effects if css allows
              >
                <div style={styles.iconBox}>{cat.icon}</div>
                <h4 style={styles.catName}>{cat.name}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- TRUST & VIBE ---------------- */}
        <section style={styles.trustSection}>
          <div style={styles.trustGrid}>
            <div style={styles.trustItem}>
              <span style={styles.checkIcon}>✔</span>
              <h4 style={styles.trustTitle}>Verified Locals</h4>
              <p style={styles.trustDesc}>Every guide and driver is verified for your safety.</p>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.checkIcon}>✔</span>
              <h4 style={styles.trustTitle}>Fair Pricing</h4>
              <p style={styles.trustDesc}>Transparent prices directly from the service providers.</p>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.checkIcon}>✔</span>
              <h4 style={styles.trustTitle}>Authentic Experience</h4>
              <p style={styles.trustDesc}>See the real Sri Lanka with locals who know it best.</p>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
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
