import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useToast } from "../context/ToastContext";
import "../styles/PaymentFlow.css";

export default function PhotoUploadPage() {
  const nav = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // ---- GET DATA FROM PREVIOUS STEP ----
  const { postData, selectedPlan } = location.state || {};

  // ---- SAFETY CHECK: IF PAGE RELOADED ----
  useEffect(() => {
    if (!postData || !selectedPlan) {
      console.warn("Missing state. Redirecting...");

      const timer = setTimeout(() => {
        nav("/provider/dashboard");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [postData, selectedPlan, nav]);

  // ---- LOCAL STATE ----
  const [photos, setPhotos] = useState([]);
  const maxPhotos = selectedPlan?.photoLimit || 5;

  // ---- ADD PHOTOS ----
  function handlePhotoChange(e) {
    const files = Array.from(e.target.files);
    const newList = [...photos, ...files].slice(0, maxPhotos);
    setPhotos(newList);
  }

  // ---- REMOVE PHOTO ----
  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // ---- CONTINUE TO PAYMENT ----
  function goToCheckout() {
    if (photos.length === 0) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    nav("/payment/checkout", {
      state: {
        postData,
        selectedPlan,
        photos,
      },
    });
  }

  // ---- IF STATE INVALID (but we let useEffect redirect) ----
  if (!postData || !selectedPlan) {
    return (
      <>
        <Navbar />
        <div className="payment-flow-container">
          <div className="payment-error payment-box">
            <p>⚠️ Error: Missing plan or service details. Redirecting…</p>
            <Link to="/provider/dashboard" className="post-btn">
              Go to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="payment-flow-container">
        <div className="payment-box">

          <h2 className="payment-title">Upload Photos</h2>
          <p className="payment-subtitle">
            Plan: <strong>{selectedPlan.name}</strong> — Max photos:{" "}
            <strong>{maxPhotos}</strong>
          </p>

          {/* ---- PHOTO INPUT ---- */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
          />

          {/* ---- PREVIEW ---- */}
          <div className="photo-grid">
            {photos.map((file, index) => (
              <div key={index} className="photo-preview">
                <img src={URL.createObjectURL(file)} alt="preview" />
                <button onClick={() => removePhoto(index)}>Remove</button>
              </div>
            ))}
          </div>

          {/* ---- ACTIONS ---- */}
          <div className="success-actions">
            <button className="post-btn" onClick={goToCheckout}>
              Continue to Payment →
            </button>

            <button
              className="close-btn"
              onClick={() => nav("/provider/dashboard")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
