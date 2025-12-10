import React from "react";
import "../styles/Footer.css";

import phoneIcon from "../assets/phone.png";
import emailIcon from "../assets/email.png";
import facebookIcon from "../assets/facebook.png";
import instagramIcon from "../assets/instagram.png";
import xIcon from "../assets/x.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-left">
          <h2 className="footer-title">Travel Commerce</h2>
          <p className="footer-tagline">
            Connect with local tour guides, drivers, hotels and experience
            providers across Sri Lanka.
          </p>
        </div>

        {/* MIDDLE */}
        <div className="footer-middle">
          <h3 className="contact-title">Contact Us</h3>

          <div className="contact-detail">
            <img src={phoneIcon} className="detail-icon" alt="Phone" />
            <p>Telephone: +94 11 234 5678</p>
          </div>

          <div className="contact-detail">
            <img src={phoneIcon} className="detail-icon" alt="Mobile" />
            <p>Mobile: +94 77 123 4567</p>
          </div>

          <div className="contact-detail">
            <img src={emailIcon} className="detail-icon" alt="Email" />
            <p>Email: support@travelcommerce.lk</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="footer-right">
          <h3 className="contact-title">Follow Us On</h3>

          <div className="contact-row">

            <div className="contact-item">
              <a href="https://facebook.com" target="_blank">
                <img src={facebookIcon} className="icon" alt="Facebook" />
              </a>
            </div>

            <div className="contact-item">
              <a href="https://instagram.com" target="_blank">
                <img src={instagramIcon} className="icon" alt="Instagram" />
              </a>
            </div>

            <div className="contact-item">
              <a href="https://x.com" target="_blank">
                <img src={xIcon} className="icon" alt="X" />
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 All Rights Reserved
      </div>
    </footer>
  );
}
