import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Assuming you have an icon library installed, e.g., react-icons or Font Awesome
// For this example, let's assume we use a simple generic profile icon.

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  // NEW STATE: To control the profile dropdown visibility
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // Ref for closing the dropdown

  function handleLogout() {
    logout();
    nav("/", { replace: true });
  }

  // Effect to handle closing the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Existing scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper function to get the correct dashboard path
  const getDashboardPath = () => {
    if (user.role === "traveller") return "/traveller/dashboard";
    if (user.role === "provider") return "/provider/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    return "/";
  };

  return (
    <header className={`nav-container ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="brand">TravelCommerce</Link>


        {/* Menu Items */}
        <div className="nav-links">
          <Link className="gradient-link" to="/services">Explore</Link>
          <Link className="gradient-link" to="/about">About Us</Link>
          <Link className="gradient-link" to="/contact">Contact</Link>
          <Link className="gradient-link" to="/feedback">Feedback</Link>
        </div>


        <div className="nav-auth-section">
          {!user ? (
            <div className="nav-actions">
              <Link to="/login" className="btn login-btn">Login</Link>
              <Link to="/register" className="btn register-btn">Register</Link>
            </div>
          ) : (
            // START OF NEW PROFILE ICON LOGIC
            <div className="profile-dropdown-container" ref={dropdownRef}>
              {/* Profile Icon/Button */}
              <button
                className="profile-icon-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-expanded={showDropdown}
                aria-label="User Profile Menu"
              >
                <span className="profile-icon">👤</span>
              </button>

              {/* Profile Dropdown Menu */}
              {showDropdown && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header">
                    <p>Logged in as:</p>
                    <p className="user-name-text">
                      <strong>{user.fullname || user.name || user.email}</strong>
                    </p>
                    <span className={`user-role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </div>

                  <Link
                    to={getDashboardPath()}
                    className="dropdown-link"
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard / Profile
                  </Link>

                  <button onClick={handleLogout} className="dropdown-logout-btn">
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}