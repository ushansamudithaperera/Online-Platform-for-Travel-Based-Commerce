import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Import the new CSS
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const dropdownRef = useRef(null);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  const closeNav = () => setIsNavCollapsed(true);

  function handleLogout() {
    logout();
    nav("/", { replace: true });
    closeNav();
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) { // Trigger earlier for smoother feel
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (user.role === "traveller") return "/traveller/dashboard";
    if (user.role === "provider") return "/provider/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    return "/";
  };

  return (
    // REMOVED INLINE STYLES. Using 'navbar-scrolled' class from CSS.
    <nav className={`navbar navbar-expand-lg fixed-top ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container">

        {/* Brand */}
        <Link className="navbar-brand" to="/" onClick={closeNav}>
          Travel<span>Commerce</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Area */}
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">

          {/* Menu Items */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link mx-2" to="/services" onClick={closeNav}>Explore</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link mx-2" to="/about" onClick={closeNav}>About Us</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link mx-2" to="/contact" onClick={closeNav}>Contact</Link>
            </li>
          </ul>

          {/* Actions */}
          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mt-3 mt-lg-0">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="nav-btn-partner text-decoration-none me-lg-2"
                  onClick={closeNav}
                >
                  Become a Partner
                </Link>
                <Link
                  to="/login"
                  className="nav-btn-signin text-decoration-none"
                  onClick={closeNav}
                >
                  Sign In
                </Link>
              </>
            ) : (
              // Logged In State
              <div className="profile-dropdown-container position-relative" ref={dropdownRef}>
                <button
                  className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: '40px', height: '40px' }}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>👤</span>
                </button>

                {showDropdown && (
                  <div
                    className="position-absolute bg-white rounded shadow p-3 mt-2 end-0 animate__animated animate__fadeIn"
                    style={{ minWidth: '250px', zIndex: 1050 }}
                  >
                    {/* Simplified Dropdown Content */}
                    <div className="border-bottom pb-2 mb-2">
                      <p className="mb-0 text-muted small">Hello,</p>
                      <p className="fw-bold text-dark mb-1">{user.fullname || user.email}</p>
                      <span className="badge bg-secondary">{user.role}</span>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      className="d-block text-decoration-none text-dark py-2 px-1 hover-bg-light"
                      onClick={() => { setShowDropdown(false); closeNav(); }}
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="btn btn-sm btn-outline-danger w-100 mt-2"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}