// src/components/ServiceFormModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createService, updateService } from "../api/serviceApi";
import "../styles/ServiceFormModal.css";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// define toolbar config near the top of the file
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
];

// ✅ ADD THIS
const TITLE_MAX_LENGTH = 50; // or 20 if you prefer the same as ProviderDashboard

// same backend base URL logic as ProviderDashboard
const backendBaseUrl = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("/")) {
    return `${backendBaseUrl}${imagePath}`;
  }
  return `${backendBaseUrl}/uploads/${imagePath}`;
};

// Plans with photo limits (plan is not changeable in edit mode)
const PLANS = [
  { id: "standard", name: "Standard Listing", price: 5, photoLimit: 5, color: "#7B68EE" },
  { id: "featured", name: "Featured Visibility", price: 15, photoLimit: 10, color: "#6A5ACD" },
  { id: "premium", name: "Premium Spotlight", price: 30, photoLimit: 30, color: "#9370DB", recommended: true },
];

export default function ServiceFormModal({
  isOpen,
  onClose,
  onSuccess,       // for create
  mode = "create", // "create" | "edit"
  initialService,  // for edit
  onUpdate,        // for edit
}) {
  const isEdit = mode === "edit";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // text fields
  const [serviceData, setServiceData] = useState({
    title: "",
    description: "",
    district: "",
    location: "",
    category: "",
    priceFrom: "",
    priceTo: "",
    priceUnit: "per person",
    currency: "LKR",
  });

  // plan (used for photo limit & price; not editable in edit)
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  // existing images already saved in DB (edit mode)
  const [existingImages, setExistingImages] = useState([]);

  // new photos selected in this modal (both create & edit)
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  // reset everything
  const resetForm = () => {
    setServiceData({
      title: "",
      description: "",
      district: "",
      location: "",
      category: "",
      priceFrom: "",
      priceTo: "",
      priceUnit: "per person",
      currency: "LKR",
    });
    setSelectedPlan(PLANS[0]);
    setExistingImages([]);
    setPhotos([]);
    setError("");
    setUploadProgress({});
  };

  // init on open
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (isEdit && initialService) {
      setServiceData({
        title: initialService.title || "",
        description: initialService.description || "",
        district: initialService.district || "",
        location: initialService.location || "",
        category: initialService.category || "",
        priceFrom: initialService.priceFrom || "",
        priceTo: initialService.priceTo || "",
        priceUnit: initialService.priceUnit || "per person",
        currency: initialService.currency || "LKR",
      });

      if (initialService.planId) {
        const found = PLANS.find((p) => p.id === initialService.planId);
        if (found) setSelectedPlan(found);
      }

      setExistingImages(initialService.images || []);
      setPhotos([]);
      setUploadProgress({});
      setError("");
    }

    if (!isEdit) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialService]);

  // computed counts for photo limits
  const maxPhotos = isEdit
    ? selectedPlan?.photoLimit || 30
    : selectedPlan.photoLimit;

  const totalImagesCount = isEdit
    ? existingImages.length + photos.length
    : photos.length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanSelect = (plan) => {
    if (isEdit) return; // can't change plan after purchase
    setSelectedPlan(plan);
    // apply limit to new photos in create mode
    if (photos.length > plan.photoLimit) {
      setPhotos((prev) => prev.slice(0, plan.photoLimit));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxPhotos - totalImagesCount;

    if (remainingSlots <= 0) {
      setError(
        `Maximum ${maxPhotos} photos allowed for ${
          selectedPlan?.name || "your plan"
        }`
      );
      return;
    }

    const newFiles = files.slice(0, remainingSlots);
    setPhotos((prev) => [...prev, ...newFiles]);
    setError("");
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    if (!isEdit) return;
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };



  //update relevant for handlesubmit
  const stripHtml = (html) =>
  html
    ? html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
    : "";

  // submit handler (create + edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
    // helper to strip HTML tags, defined above handleSubmit
    const descPlain = stripHtml(serviceData.description);

    if (!serviceData.title.trim() || !descPlain) {
      throw new Error("Title and description are required");
    }

      // ------------- EDIT MODE -------------
      if (isEdit) {
        if (!initialService?.id) {
          throw new Error("Missing service ID for update");
        }

        const formData = new FormData();
        const serviceJson = JSON.stringify({
          ...serviceData,
          existingImages, // images user decided to keep
        });

        formData.append("serviceData", serviceJson);
        photos.forEach((file) => formData.append("images", file));

        const res = await updateService(initialService.id, formData);
        if (onUpdate) onUpdate(res.data);
        onClose();
        return;
      }

      // ------------- CREATE MODE -------------
      if (photos.length === 0) {
        throw new Error("Please upload at least one photo");
      }

      const formData = new FormData();
      const serviceJson = JSON.stringify({
        ...serviceData,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
      });

      formData.append("serviceData", serviceJson);
      photos.forEach((file) => formData.append("images", file));

      const response = await createService(formData);
      const createdService = response.data;

      onClose();

      navigate("/payment/checkout", {
        state: {
          postData: createdService,
          selectedPlan: selectedPlan,
        },
      });

      if (onSuccess) onSuccess(createdService);
    } catch (err) {
      const backendMsg = err.response?.data;
      const fallbackMsg =
        err.message || "Failed to save service. Please try again.";

      let finalMsg;
      if (typeof backendMsg === "string") {
        finalMsg = backendMsg;
      } else if (backendMsg && typeof backendMsg === "object") {
        finalMsg = JSON.stringify(backendMsg);
      } else {
        finalMsg = fallbackMsg;
      }

      setError(finalMsg);
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="service-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Service" : "Create New Service"}</h2>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          <div className="form-columns">
            {/* LEFT: Service details */}
            <div className="form-left">
              <h3>Service Details</h3>

<div className="form-group">
  <label>
    Service Title *
    <span className="title-char-counter">
      {serviceData.title.length}/{TITLE_MAX_LENGTH}
    </span>
  </label>
  <input
    type="text"
    name="title"
    value={serviceData.title}
    onChange={handleInputChange}
    placeholder="e.g., Blue Horizon Ocean Resort & Spa"
    required
    maxLength={TITLE_MAX_LENGTH}
  />
</div>

<div className="form-group">
  <label>Description *</label>
  <ReactQuill
    value={serviceData.description}
    onChange={(value) =>
      setServiceData((prev) => ({ ...prev, description: value }))
    }
    modules={quillModules}
    formats={quillFormats}
    theme="snow"
    placeholder="Describe your service, what’s included, price details, etc..."
  />
</div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={serviceData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Tour Guide">Tour Guide</option>
                  <option value="Driver">Driver</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Experience">Experience</option>
                  <option value="Restaurant">Restaurant</option>
                </select>
              </div>

              <div className="form-group">
                <label>District *</label>
                <select
                  name="district"
                  value={serviceData.district}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select District</option>
                  <option value="Ampara">Ampara</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                  <option value="Badulla">Badulla</option>
                  <option value="Batticaloa">Batticaloa</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Galle">Galle</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Hambantota">Hambantota</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Kegalle">Kegalle</option>
                  <option value="Kilinochchi">Kilinochchi</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Mannar">Mannar</option>
                  <option value="Matale">Matale</option>
                  <option value="Matara">Matara</option>
                  <option value="Monaragala">Monaragala</option>
                  <option value="Mullaitivu">Mullaitivu</option>
                  <option value="Nuwara Eliya">Nuwara Eliya</option>
                  <option value="Polonnaruwa">Polonnaruwa</option>
                  <option value="Puttalam">Puttalam</option>
                  <option value="Ratnapura">Ratnapura</option>
                  <option value="Trincomalee">Trincomalee</option>
                  <option value="Vavuniya">Vavuniya</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location (Google Maps URL)</label>
                <input
                  type="url"
                  name="location"
                  value={serviceData.location}
                  onChange={handleInputChange}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* PRICING SECTION */}
              <div className="pricing-input-section">
                <h4 className="pricing-section-header">💰 Pricing Information</h4>
                <p className="pricing-hint-text">
                  Set your service prices. These will be prominently displayed to travelers.
                </p>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      name="currency"
                      value={serviceData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price Unit</label>
                    <select
                      name="priceUnit"
                      value={serviceData.priceUnit}
                      onChange={handleInputChange}
                    >
                      <option value="per person">Per Person</option>
                      <option value="per day">Per Day</option>
                      <option value="per night">Per Night</option>
                      <option value="per hour">Per Hour</option>
                      <option value="per trip">Per Trip</option>
                      <option value="per group">Per Group</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price From</label>
                    <input
                      type="number"
                      name="priceFrom"
                      value={serviceData.priceFrom}
                      onChange={handleInputChange}
                      placeholder="e.g., 5000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price To (Optional)</label>
                    <input
                      type="number"
                      name="priceTo"
                      value={serviceData.priceTo}
                      onChange={handleInputChange}
                      placeholder="e.g., 10000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {isEdit && (
                <p className="edit-note">
                  You can update information and manage photos. Plan and payment
                  remain unchanged.
                </p>
              )}
            </div>

            {/* RIGHT: Create vs Edit */}
            <div className="form-right">
              {isEdit ? (
                <>
                  <h3>Manage Images</h3>
                  <p className="upload-hint">
                    Your current plan (
                    {selectedPlan?.name || "Listing"}) allows up to{" "}
                    {maxPhotos} photos. You currently have{" "}
                    {totalImagesCount}/{maxPhotos}.
                  </p>

                  {/* Existing images */}
                  {existingImages.length > 0 && (
                    <>
                      <h4>Current Photos ({existingImages.length})</h4>
                      <div className="photo-preview-grid">
                        {existingImages.map((url, index) => (
                          <div
                            key={index}
                            className="photo-preview-item existing"
                          >
                            <img
                              src={getImageUrl(url)}
                              alt={`Existing ${index + 1}`}
                            />
                            <div className="photo-overlay">
                              <span className="photo-index">
                                {index + 1}
                              </span>
                              <button
                                type="button"
                                className="remove-photo"
                                onClick={() => removeExistingImage(index)}
                                disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* New images in edit */}
                  <div className="photo-upload-section">
                    <h4>
                      Add New Photos ({photos.length}) – total{" "}
                      {totalImagesCount}/{maxPhotos}
                    </h4>

                    <div className="upload-area">
                      <input
                        type="file"
                        id="photo-upload-edit"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        disabled={totalImagesCount >= maxPhotos || loading}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="photo-upload-edit"
                        className={`upload-button ${
                          totalImagesCount >= maxPhotos ? "disabled" : ""
                        }`}
                      >
                        📁 Add Photos
                      </label>
                      <p className="upload-hint">
                        You can add up to {maxPhotos} photos total (existing +
                        new).
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="photo-preview-grid">
                        {photos.map((file, index) => (
                          <div
                            key={index}
                            className="photo-preview-item new-photo"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                            />
                            <div className="photo-overlay">
                              <span className="photo-index">
                                {existingImages.length + index + 1}
                              </span>
                              <button
                                type="button"
                                className="remove-photo"
                                onClick={() => removePhoto(index)}
                                disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3>Visibility Plan</h3>

                  <div className="plan-selection">
                    {PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className={`plan-option ${
                          selectedPlan.id === plan.id ? "selected" : ""
                        } ${plan.recommended ? "recommended" : ""}`}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        {plan.recommended && (
                          <span className="recommended-badge">
                            Recommended
                          </span>
                        )}
                        <h4>{plan.name}</h4>
                        <div className="plan-price">${plan.price}</div>
                        <div className="plan-features">
                          <div>📷 {plan.photoLimit} photos</div>
                          <div>✅ One-time payment</div>
                          {plan.id === "premium" && (
                            <div>⭐ Top visibility</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="photo-upload-section">
                    <h4>
                      Upload Photos ({photos.length}/{selectedPlan.photoLimit})
                    </h4>

                    <div className="upload-area">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        disabled={totalImagesCount >= maxPhotos || loading}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`upload-button ${
                          totalImagesCount >= maxPhotos ? "disabled" : ""
                        }`}
                      >
                        📁 Choose Photos
                      </label>
                      <p className="upload-hint">
                        Drag & drop or click to upload (max{" "}
                        {selectedPlan.photoLimit})
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="photo-preview-grid">
                        {photos.map((file, index) => (
                          <div key={index} className="photo-preview-item">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                            />
                            <div className="photo-overlay">
                              <span className="photo-index">
                                {index + 1}
                              </span>
                              <button
                                type="button"
                                className="remove-photo"
                                onClick={() => removePhoto(index)}
                                disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {totalImagesCount >= maxPhotos && (
                      <div className="limit-warning">
                        ⚠️ Maximum {maxPhotos} photos reached for{" "}
                        {selectedPlan.name} plan
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || (!isEdit && photos.length === 0)}
            >
              {isEdit
                ? loading
                  ? "Saving..."
                  : "Save Changes"
                : loading
                ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                )
                : `Proceed to Checkout ($${selectedPlan.price})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}