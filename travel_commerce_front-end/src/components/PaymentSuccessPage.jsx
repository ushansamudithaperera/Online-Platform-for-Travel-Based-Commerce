import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../styles/PaymentFlow.css";

export default function PaymentSuccessPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { planName, planPrice, postTitle, postId, isNewPost } = location.state || {};
  const [showContent, setShowContent] = useState(false);

  /* redirect if state is missing */
  useEffect(() => {
    if (!planName) {
      const t = setTimeout(() => nav("/provider/dashboard"), 3000);
      return () => clearTimeout(t);
    }
    /* delay for entrance animation */
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, [planName, nav]);

  return (
    <>
      <Navbar />
      <div className="pf-container">
        {/* stepper — all done */}
        <div className="pf-stepper">
          {["Payment", "Confirmation"].map((label, i) => (
            <React.Fragment key={label}>
              <div className={`pf-step done`}>
                <div className="pf-step-circle">✓</div>
                <span className="pf-step-label">{label}</span>
              </div>
              {i < 1 && <div className="pf-step-line done" />}
            </React.Fragment>
          ))}
        </div>

        {/* success card */}
        <div className={`pf-card pf-success-card ${showContent ? "visible" : ""}`}>
          {/* animated checkmark */}
          <div className="pf-success-check">
            <svg className="pf-checkmark" viewBox="0 0 52 52">
              <circle className="pf-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="pf-checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h2 className="pf-success-title">Payment Successful!</h2>
          <p className="pf-success-subtitle">
            Your service is now live and visible to travellers.
          </p>

          {/* receipt card */}
          <div className="pf-receipt">
            <div className="pf-receipt-row">
              <span className="pf-receipt-label">Service</span>
              <span className="pf-receipt-value">{postTitle || "Your Service"}</span>
            </div>
            <div className="pf-receipt-row">
              <span className="pf-receipt-label">Plan</span>
              <span className="pf-receipt-value">{planName}</span>
            </div>
            {planPrice && (
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Amount Paid</span>
                <span className="pf-receipt-value pf-receipt-amount">${planPrice}.00</span>
              </div>
            )}
            <div className="pf-receipt-row">
              <span className="pf-receipt-label">Status</span>
              <span className="pf-receipt-value pf-status-active">● Active</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="pf-success-actions">
            <Link to="/provider/dashboard" className="pf-btn pf-btn-primary">
              Go to Dashboard
            </Link>
          </div>

          <p className="pf-mock-badge" style={{ marginTop: "1.5rem" }}>
            🧪 Demo Mode — No real charges were made
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}