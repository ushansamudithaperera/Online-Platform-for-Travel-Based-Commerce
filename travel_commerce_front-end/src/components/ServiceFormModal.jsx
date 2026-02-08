// src/components/ServiceFormModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createService, updateService } from "../api/serviceApi";
import { useToast } from "../context/ToastContext";
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

// Currency symbol map for inline display
const CURRENCY_SYMBOLS = {
  LKR: "Rs.",
  USD: "$",
};



// Category-specific price unit options
const PRICE_UNITS_BY_CATEGORY = {
  "Tour Guide": [
    { value: "per person", label: "Per Person" },
    { value: "per group", label: "Per Group" },
    { value: "per day", label: "Per Day" },
    { value: "per half day", label: "Per Half Day" },
    { value: "per hour", label: "Per Hour" },
  ],
  "Hotel": [
    { value: "per day", label: "Per Day" },
    { value: "per night", label: "Per Night" },
    { value: "per room", label: "Per Room" },
  ],
  "Restaurant": [], // no unit dropdown — average meal cost
  "Experience": [
    { value: "per person", label: "Per Person" },
    { value: "per group", label: "Per Group" },
    { value: "per package", label: "Per Package" },
  ],
  "Driver": [
    { value: "per km", label: "Per Km" },
    { value: "per day", label: "Per Day" },
    { value: "per destination", label: "Per Destination" },
  ],
};

// Category-specific price field labels
const PRICE_LABELS = {
  "Tour Guide": { from: "Starting Rate", to: "Maximum Rate", placeholder: "e.g., 5,000" },
  "Hotel": { from: "Starting Rate", to: "Highest Rate", placeholder: "e.g., 8,000" },
  "Restaurant": { from: "Avg. Meal Cost", to: null, placeholder: "e.g., 1,500" },
  "Experience": { from: "Starting Price", to: "Up To", placeholder: "e.g., 3,000" },
  "Driver": { from: "Starting Fare", to: "Maximum Fare", placeholder: "e.g., 75" },
};

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

// Predefined options for each category
const CATEGORY_OFFERINGS = {
  "hotel": {
    label: "Room Types",
    options: ["Single Room", "Double Room", "Twin Room", "Triple Room", "Suite", "Deluxe Room", "Family Room", "Studio"],
    key: "roomTypes"
  },
  "driver": {
    label: "Vehicle Types",
    options: ["Car", "Van", "SUV", "Minibus", "Bus", "Luxury Car", "Tuk Tuk"],
    key: "vehicleTypes"
  },
  "tour guide": {
    label: "Languages",
    options: ["English", "Sinhala", "Tamil", "French", "German", "Spanish", "Italian", "Chinese", "Japanese", "Korean"],
    key: "languages"
  },
  "experience": {
    label: "Activity Types",
    options: ["Water Sports", "Hiking", "Cycling", "Wildlife Watching", "Cultural Experience", "Adventure Sports", "Wellness & Yoga", "Surfing", "Diving"],
    key: "activityTypes"
  },
  "restaurant": {
    label: "Cuisine Types",
    options: ["Sri Lankan", "Continental", "Chinese", "Indian", "Thai", "Italian", "Seafood", "Mediterranean", "Vegetarian", "Vegan"],
    key: "cuisineTypes"
  }
};

// Helper function to build offerings object from selected items
const buildOfferings = (category, selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) return {};
  
  const categoryLower = (category || "").toLowerCase();
  const config = CATEGORY_OFFERINGS[categoryLower];
  
  if (config && config.key) {
    return { [config.key]: selectedItems };
  }
  
  return {};
};

export default function ServiceFormModal({
  isOpen,
  onClose,
  onSuccess,       // for create
  mode = "create", // "create" | "edit"
  initialService,  // for edit
  onUpdate,        // for edit
  initialFormData, // pre-fill create form when returning from checkout
}) {
  const isEdit = mode === "edit";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

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
    externalBookingUrl: "",
    whatsappNumber: "",
  });

  // plan (used for photo limit & price; not editable in edit)
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  // existing images already saved in DB (edit mode)
  const [existingImages, setExistingImages] = useState([]);

  // new photos selected in this modal (both create & edit)
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Offerings checkboxes - array of selected items
  const [selectedOfferings, setSelectedOfferings] = useState([]);

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
      externalBookingUrl: "",
      whatsappNumber: "",
    });
    setSelectedPlan(PLANS[0]);
    setExistingImages([]);
    setPhotos([]);
    setError("");
    setUploadProgress({});
    setSelectedOfferings([]);
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
        externalBookingUrl: initialService.externalBookingUrl || "",
        whatsappNumber: initialService.whatsappNumber || "",
      });

      if (initialService.planId) {
        const found = PLANS.find((p) => p.id === initialService.planId);
        if (found) setSelectedPlan(found);
      }

      setExistingImages(initialService.images || []);
      setPhotos([]);
      setUploadProgress({});
      setError("");
      
      // Extract serviceOfferings to array
      if (initialService.serviceOfferings) {
        const offeringsArray = Object.values(initialService.serviceOfferings)
          .flat()
          .filter(Boolean);
        setSelectedOfferings(offeringsArray);
      } else {
        setSelectedOfferings([]);
      }
    }

    if (!isEdit && initialFormData) {
      // Returning from checkout — restore previously typed data
      setServiceData({
        title: initialFormData.serviceData?.title || "",
        description: initialFormData.serviceData?.description || "",
        district: initialFormData.serviceData?.district || "",
        location: initialFormData.serviceData?.location || "",
        category: initialFormData.serviceData?.category || "",
        priceFrom: initialFormData.serviceData?.priceFrom || "",
        priceTo: initialFormData.serviceData?.priceTo || "",
        priceUnit: initialFormData.serviceData?.priceUnit || "per person",
        currency: initialFormData.serviceData?.currency || "LKR",
        externalBookingUrl: initialFormData.serviceData?.externalBookingUrl || "",
        whatsappNumber: initialFormData.serviceData?.whatsappNumber || "",
      });
      if (initialFormData.selectedPlan) {
        const found = PLANS.find((p) => p.id === initialFormData.selectedPlan.id);
        if (found) setSelectedPlan(found);
      }
      if (initialFormData.photos) setPhotos(initialFormData.photos);
      if (initialFormData.selectedOfferings) setSelectedOfferings(initialFormData.selectedOfferings);
      setError("");
    } else if (!isEdit) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialService, initialFormData]);

  // computed counts for photo limits
  const maxPhotos = isEdit
    ? selectedPlan?.photoLimit || 30
    : selectedPlan.photoLimit;

  const totalImagesCount = isEdit
    ? existingImages.length + photos.length
    : photos.length;

  // When category changes, reset priceUnit to the first option for that category
  useEffect(() => {
    const cat = serviceData.category;
    if (!cat) return;
    const units = PRICE_UNITS_BY_CATEGORY[cat];
    if (units && units.length > 0) {
      // only reset if the current priceUnit is not valid for the new category
      const valid = units.some((u) => u.value === serviceData.priceUnit);
      if (!valid) {
        setServiceData((prev) => ({ ...prev, priceUnit: units[0].value }));
      }
    } else {
      // Restaurant — no unit needed, and clear priceTo since it only uses a single price
      setServiceData((prev) => ({ ...prev, priceUnit: "", priceTo: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceData.category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Title field: allow only letters, spaces, and basic punctuation (no numbers)
    if (name === "title") {
      const lettersOnly = value.replace(/[0-9]/g, "");
      setServiceData((prev) => ({ ...prev, [name]: lettersOnly }));
      return;
    }
    setServiceData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle price input: strip non-numeric chars (except dot), store raw number
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    // Allow only digits and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setServiceData((prev) => ({ ...prev, [name]: cleaned }));
  };

  // Format a number string with thousand separators for display
  const formatNumberDisplay = (val) => {
    if (!val && val !== 0) return "";
    const num = Number(val);
    if (Number.isNaN(num)) return val;
    // Split by decimal to preserve decimal part
    const parts = String(val).split(".");
    const intPart = Number(parts[0]).toLocaleString();
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };

  // Build a live price preview string
  const buildPricePreview = () => {
    const cat = serviceData.category;
    if (!cat || !serviceData.priceFrom) return null;
    const symbol = CURRENCY_SYMBOLS[serviceData.currency] || serviceData.currency;
    const from = formatNumberDisplay(serviceData.priceFrom);
    const to = serviceData.priceTo ? formatNumberDisplay(serviceData.priceTo) : null;
    const unit = serviceData.priceUnit ? ` ${serviceData.priceUnit}` : "";

    if (to) {
      return `${symbol} ${from} – ${to}${unit}`;
    }
    return `From ${symbol} ${from}${unit}`;
  };

  // Validate price fields
  const getPriceErrors = () => {
    const errors = [];
    const cat = serviceData.category;
    if (!cat) return errors;

    const from = Number(serviceData.priceFrom);
    const to = serviceData.priceTo ? Number(serviceData.priceTo) : null;

    if (to !== null && from && to <= from) {
      errors.push("Maximum price must be higher than the starting price");
    }
    return errors;
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

  const normalizeWhatsappDigits = (raw) => {
    const value = (raw || "").trim();
    if (!value) return "";

    // Remove common separators and keep leading + if present.
    const cleaned = value.replace(/[\s()\-\.]/g, "");
    const hasPlus = cleaned.startsWith("+");
    let digits = cleaned.replace(/\D/g, "");

    // Support 00 prefix (international) by stripping.
    if (!hasPlus && digits.startsWith("00")) {
      digits = digits.slice(2);
    }

    // Support Sri Lanka local format 0XXXXXXXXX -> 94XXXXXXXXX
    if (digits.length === 10 && digits.startsWith("0")) {
      digits = `94${digits.slice(1)}`;
    }

    return digits;
  };

  const getWhatsappNumberError = (raw) => {
    const value = (raw || "").trim();
    if (!value) return null;
    if (/[A-Za-z]/.test(value)) {
      return "WhatsApp number must not contain letters";
    }

    // '+' is only allowed at the start, if present
    const plusIndex = value.indexOf("+");
    if (plusIndex > 0) {
      return "WhatsApp number: '+' must be at the beginning";
    }

    const digits = normalizeWhatsappDigits(value);
    if (!digits) {
      return "WhatsApp number is invalid";
    }
    if (digits.length < 8 || digits.length > 15) {
      return "WhatsApp number must have 8 to 15 digits";
    }

    // If the user entered a local-looking number that wasn't converted, reject.
    if (digits.startsWith("0")) {
      return "Please include country code (e.g., +94...) or use 0XXXXXXXXX for Sri Lanka";
    }

    return null;
  };

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

    // Validate pricing
    const priceErrors = getPriceErrors();
    if (priceErrors.length > 0) {
      throw new Error(priceErrors[0]);
    }

    const whatsappError = getWhatsappNumberError(serviceData.whatsappNumber);
    if (whatsappError) {
      throw new Error(whatsappError);
    }

      // ------------- EDIT MODE -------------
      if (isEdit) {
        if (!initialService?.id) {
          throw new Error("Missing service ID for update");
        }

        const formData = new FormData();
        
        // Build offerings object from selected items
        const serviceOfferings = buildOfferings(serviceData.category, selectedOfferings);
        
        const serviceJson = JSON.stringify({
          ...serviceData,
          whatsappNumber: serviceData.whatsappNumber?.trim() || "",
          existingImages, // images user decided to keep
          serviceOfferings,
        });

        formData.append("serviceData", serviceJson);
        photos.forEach((file) => formData.append("images", file));

        const res = await updateService(initialService.id, formData);
        if (onUpdate) onUpdate(res.data);
        toast.success("Service updated successfully!");
        onClose();
        return;
      }

      // ------------- CREATE MODE -------------
      if (photos.length === 0) {
        throw new Error("Please upload at least one photo");
      }

      // Don't create the service yet — go to payment first.
      // Pass all form data so checkout can create the service after payment.
      const formSnapshot = {
        serviceData: { ...serviceData, whatsappNumber: serviceData.whatsappNumber?.trim() || "" },
        selectedPlan,
        photos,
        selectedOfferings,
        serviceOfferings: buildOfferings(serviceData.category, selectedOfferings),
      };

      onClose();

      navigate("/payment/checkout", {
        state: {
          formSnapshot,
          selectedPlan,
        },
      });
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
      toast.error(finalMsg);
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
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

              {/* OFFERINGS FIELD - Category specific checkboxes */}
              {serviceData.category && CATEGORY_OFFERINGS[serviceData.category.toLowerCase()] && (
                <div className="form-group offerings-checklist">
                  <label className="offerings-label">
                    <span className="label-icon">✓</span>
                    {CATEGORY_OFFERINGS[serviceData.category.toLowerCase()].label}
                    <span className="label-badge">{selectedOfferings.length} selected</span>
                  </label>
                  <div className="offerings-grid">
                    {CATEGORY_OFFERINGS[serviceData.category.toLowerCase()].options.map((option) => (
                      <label key={option} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedOfferings.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOfferings([...selectedOfferings, option]);
                            } else {
                              setSelectedOfferings(selectedOfferings.filter(item => item !== option));
                            }
                          }}
                        />
                        <span className="checkbox-label">{option}</span>
                      </label>
                    ))}
                  </div>
                  <span className="form-text">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle', marginRight: '6px'}}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Select all that apply. Travellers will only see these options when booking.
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>External Booking Site (Optional)</label>
                <input
                  type="url"
                  name="externalBookingUrl"
                  value={serviceData.externalBookingUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-booking-site.com"
                />
                <span className="form-text">
                  If you have your own booking website, add the URL here. Travellers will be redirected to your site to complete the booking.
                </span>
              </div>

              <div className="form-group">
                <label>WhatsApp Number (Optional)</label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  value={serviceData.whatsappNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., +94771234567 or 0771234567"
                />
                <span className="form-text">
                  Add a WhatsApp contact number so travellers can chat with you directly.
                </span>
              </div>

              {/* PRICING SECTION */}
              <div className="pricing-input-section">
                <h4 className="pricing-section-header">💰 Pricing Information</h4>
                <p className="pricing-hint-text">
                  Set your service prices. These will be prominently displayed to travelers.
                </p>

                {!serviceData.category ? (
                  <p className="pricing-select-category-msg">
                    Please select a category above to configure pricing options.
                  </p>
                ) : (
                  <>
                    {/* Currency & Price Unit row */}
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
                        </select>
                      </div>

                      {/* Price Unit dropdown — only for categories that have units */}
                      {PRICE_UNITS_BY_CATEGORY[serviceData.category]?.length > 0 && (
                        <div className="form-group">
                          <label>Charging Method</label>
                          <select
                            name="priceUnit"
                            value={serviceData.priceUnit}
                            onChange={handleInputChange}
                          >
                            {PRICE_UNITS_BY_CATEGORY[serviceData.category].map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Price input row with inline currency symbol */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          {PRICE_LABELS[serviceData.category]?.from || "Price"} *
                        </label>
                        <div className="price-input-wrapper">
                          <span className="price-currency-prefix">
                            {CURRENCY_SYMBOLS[serviceData.currency] || serviceData.currency}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            name="priceFrom"
                            value={serviceData.priceFrom}
                            onChange={handlePriceChange}
                            placeholder={PRICE_LABELS[serviceData.category]?.placeholder || "e.g., 5,000"}
                            className="price-input-field"
                            required
                          />
                        </div>
                        {serviceData.priceFrom && (
                          <span className="price-formatted-hint">
                            {formatNumberDisplay(serviceData.priceFrom)}
                          </span>
                        )}
                      </div>

                      {/* Price To — available for categories with unit options */}
                      {PRICE_LABELS[serviceData.category]?.to && (
                        <div className="form-group">
                          <label>{PRICE_LABELS[serviceData.category].to} (Optional)</label>
                          <div className="price-input-wrapper">
                            <span className="price-currency-prefix">
                              {CURRENCY_SYMBOLS[serviceData.currency] || serviceData.currency}
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              name="priceTo"
                              value={serviceData.priceTo}
                              onChange={handlePriceChange}
                              placeholder="e.g., 10,000"
                              className="price-input-field"
                            />
                          </div>
                          {serviceData.priceTo && (
                            <span className="price-formatted-hint">
                              {formatNumberDisplay(serviceData.priceTo)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Validation errors */}
                    {getPriceErrors().length > 0 && (
                      <div className="pricing-errors">
                        {getPriceErrors().map((err, i) => (
                          <p key={i} className="pricing-error-msg">⚠️ {err}</p>
                        ))}
                      </div>
                    )}

                    {/* LIVE PRICE PREVIEW */}
                    {buildPricePreview() && (
                      <div className="pricing-live-preview">
                        <span className="preview-label">Travellers will see:</span>
                        <span className="preview-value">{buildPricePreview()}</span>
                      </div>
                    )}

                    {/* Helpful hint per category */}
                    {serviceData.category === "Restaurant" && (
                      <p className="pricing-category-hint">
                        💡 Enter the average cost of a meal at your restaurant.
                      </p>
                    )}
                    {serviceData.category === "Experience" && (
                      <p className="pricing-category-hint">
                        💡 Set the starting price and choose how you charge — per person, per group, or per package.
                      </p>
                    )}
                    {serviceData.category === "Tour Guide" && (
                      <p className="pricing-category-hint">
                        💡 Set your rate and choose the charging method that fits your service style.
                      </p>
                    )}
                    {serviceData.category === "Hotel" && (
                      <p className="pricing-category-hint">
                        💡 Enter your room rate. Most hotels charge per night or per room per night.
                      </p>
                    )}
                    {serviceData.category === "Driver" && (
                      <p className="pricing-category-hint">
                        💡 Set your fare — per km for metered trips, per day for full-day hire, or per destination for fixed routes.
                      </p>
                    )}
                  </>
                )}
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