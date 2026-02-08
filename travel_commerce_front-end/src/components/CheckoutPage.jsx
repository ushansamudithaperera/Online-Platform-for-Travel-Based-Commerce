import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { createService } from "../api/serviceApi";
import { useToast } from "../context/ToastContext";
import "../styles/PaymentFlow.css";

/* ─── Card brand detector ─── */
const detectBrand = (num) => {
  if (!num) return null;
  if (num.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return "mastercard";
  if (num.startsWith("3")) return "amex";
  return "generic";
};

const BRAND_LABELS = { visa: "VISA", mastercard: "MC", amex: "AMEX", generic: "" };

export default function CheckoutPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { formSnapshot, selectedPlan } = location.state || {};

  /* ─── state ─── */
  const [step, setStep] = useState(1); // 1 = payment, 2 = processing
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  /* ─── missing data guard ─── */
  if (!formSnapshot || !selectedPlan) {
    return (
      <>
        <Navbar />
        <div className="pf-container">
          <div className="pf-card pf-error-card">
            <div className="pf-error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>Service details are missing. Please create a new post from the dashboard.</p>
            <Link to="/provider/dashboard" className="pf-btn pf-btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ─── helpers ─── */
  const formatCardNumber = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name === "number") {
      setCard((p) => ({ ...p, number: value.replace(/\D/g, "").slice(0, 16) }));
    } else if (name === "expiry") {
      let v = value.replace(/[^\d/]/g, "");
      const raw = v.replace(/\//g, "");
      if (raw.length > 4) return;
      // Restrict month to 01-12
      if (raw.length >= 2) {
        const mm = parseInt(raw.slice(0, 2), 10);
        if (mm < 1 || mm > 12) return;
      } else if (raw.length === 1 && parseInt(raw, 10) > 1) {
        // If first digit > 1, auto-prefix with 0
        v = "0" + raw;
        setCard((p) => ({ ...p, expiry: v.slice(0, 2) + "/" }));
        return;
      }
      if (raw.length > 2) v = raw.slice(0, 2) + "/" + raw.slice(2);
      else v = raw;
      setCard((p) => ({ ...p, expiry: v }));
    } else if (name === "cvc") {
      setCard((p) => ({ ...p, cvc: value.replace(/\D/g, "").slice(0, 4) }));
    } else if (name === "name") {
      setCard((p) => ({ ...p, name: value.replace(/[^a-zA-Z\s]/g, "") }));
    } else {
      setCard((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (card.number.length < 13) e.number = "Enter a valid card number";
    if (!card.name.trim()) e.name = "Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(card.name)) e.name = "Name must contain letters only";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      e.expiry = "Use MM/YY format";
    } else {
      const [mm, yy] = card.expiry.split("/").map(Number);
      if (mm < 1 || mm > 12) {
        e.expiry = "Invalid month";
      } else {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear() % 100;
        if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
          e.expiry = "Card has expired";
        } else if (yy > currentYear + 10) {
          e.expiry = "Expiry date too far in the future";
        }
      }
    }
    if (card.cvc.length < 3) e.cvc = "Enter a valid CVC";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStep(2);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 15 + 5;
      });
    }, 300);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2800));
    clearInterval(interval);
    setProgress(100);

    try {
      // Create the service AFTER successful payment
      const formData = new FormData();
      const serviceJson = JSON.stringify({
        ...formSnapshot.serviceData,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        serviceOfferings: formSnapshot.serviceOfferings,
      });
      formData.append("serviceData", serviceJson);
      formSnapshot.photos.forEach((file) => formData.append("images", file));

      const response = await createService(formData);
      const createdService = response.data;

      nav("/payment/success", {
        state: {
          planName: selectedPlan.name,
          planPrice: selectedPlan.price,
          postTitle: createdService.title || formSnapshot.serviceData.title || "Your Service",
          postId: createdService.id,
          isNewPost: true,
        },
      });
    } catch (err) {
      console.error("Service creation failed after payment:", err);
      toast.error("Payment processed but service creation failed. Please try again.");
      setStep(1);
      setErrors({ number: "Payment processed but service creation failed. Please try again." });
    }
  };

  const brand = detectBrand(card.number);

  return (
    <>
      <Navbar />
      <div className="pf-container">
        {/* ─── Progress Stepper ─── */}
        <div className="pf-stepper">
          {["Payment", "Confirmation"].map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={label}>
                <div className={`pf-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                  <div className="pf-step-circle">{isDone ? "✓" : num}</div>
                  <span className="pf-step-label">{label}</span>
                </div>
                {i < 1 && <div className={`pf-step-line ${isDone ? "done" : ""}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ════════ STEP 1 — Payment ════════ */}
        {step === 1 && (
          <div className="pf-card pf-payment-card">
            <div className="pf-payment-layout">
              {/* Left — Order Summary */}
              <div className="pf-order-summary">
                <h3>Order Summary</h3>
                <div className="pf-summary-item">
                  <span className="pf-summary-label">Service</span>
                  <span className="pf-summary-value">{formSnapshot.serviceData?.title || "New Service"}</span>
                </div>
                <div className="pf-summary-item">
                  <span className="pf-summary-label">Plan</span>
                  <span className="pf-summary-value pf-plan-tag" style={{ background: selectedPlan.color }}>
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="pf-summary-item">
                  <span className="pf-summary-label">Photos allowed</span>
                  <span className="pf-summary-value">{selectedPlan.photoLimit}</span>
                </div>
                <div className="pf-summary-divider" />
                <div className="pf-summary-item pf-summary-total">
                  <span className="pf-summary-label">Total</span>
                  <span className="pf-summary-value">${selectedPlan.price}.00</span>
                </div>
              </div>

              {/* Right — Card Form */}
              <form className="pf-card-form" onSubmit={handlePayment}>
                <h3>Payment Details</h3>

                <div className="pf-form-group">
                  <label>Card Number</label>
                  <div className={`pf-input-wrapper ${errors.number ? "error" : ""}`}>
                    <span className="pf-input-icon">💳</span>
                    <input
                      type="text"
                      name="number"
                      value={formatCardNumber(card.number)}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                    />
                    {brand && <span className="pf-card-brand">{BRAND_LABELS[brand]}</span>}
                  </div>
                  {errors.number && <span className="pf-field-error">{errors.number}</span>}
                </div>

                <div className="pf-form-group">
                  <label>Name on Card</label>
                  <div className={`pf-input-wrapper ${errors.name ? "error" : ""}`}>
                    <span className="pf-input-icon">👤</span>
                    <input
                      type="text"
                      name="name"
                      value={card.name}
                      onChange={handleCardChange}
                      placeholder="John Doe"
                      autoComplete="cc-name"
                    />
                  </div>
                  {errors.name && <span className="pf-field-error">{errors.name}</span>}
                </div>

                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>Expiry Date</label>
                    <div className={`pf-input-wrapper ${errors.expiry ? "error" : ""}`}>
                      <span className="pf-input-icon">📅</span>
                      <input
                        type="text"
                        name="expiry"
                        value={card.expiry}
                        onChange={handleCardChange}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                      />
                    </div>
                    {errors.expiry && <span className="pf-field-error">{errors.expiry}</span>}
                  </div>
                  <div className="pf-form-group">
                    <label>CVC</label>
                    <div className={`pf-input-wrapper ${errors.cvc ? "error" : ""}`}>
                      <span className="pf-input-icon">🔐</span>
                      <input
                        type="text"
                        name="cvc"
                        value={card.cvc}
                        onChange={handleCardChange}
                        placeholder="123"
                        autoComplete="cc-csc"
                      />
                    </div>
                    {errors.cvc && <span className="pf-field-error">{errors.cvc}</span>}
                  </div>
                </div>

                <div className="pf-card-actions">
                  <button type="button" className="pf-btn pf-btn-ghost" onClick={() => nav("/provider/dashboard", { state: { returnFormData: formSnapshot } })}>
                    ← Back to Service Form
                  </button>
                  <button type="submit" className="pf-btn pf-btn-primary pf-btn-pay">
                    Pay ${selectedPlan.price}.00
                  </button>
                </div>

                <p className="pf-mock-badge">
                 {/*🧪 Demo Mode — No real charges. Enter any card details to proceed. */}
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ════════ STEP 2 — Processing ════════ */}
        {step === 2 && (
          <div className="pf-card pf-processing-card">
            <div className="pf-processing-content">
              <div className="pf-spinner-ring" />
              <h2>Processing Payment</h2>
              <p>Please wait while we securely process your payment…</p>
              <div className="pf-progress-bar">
                <div className="pf-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <span className="pf-progress-text">{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}