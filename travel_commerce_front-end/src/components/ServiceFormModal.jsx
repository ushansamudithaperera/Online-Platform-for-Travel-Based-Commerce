// src/components/ServiceFormModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createService } from "../api/serviceApi";
import "../styles/ServiceFormModal.css"; // We'll create this CSS

// Define plans with photo limits
const PLANS = [
  { id: 'standard', name: 'Standard Listing', price: 5, photoLimit: 5, color: '#7B68EE' },
  { id: 'featured', name: 'Featured Visibility', price: 15, photoLimit: 10, color: '#6A5ACD' },
  { id: 'premium', name: 'Premium Spotlight', price: 30, photoLimit: 30, color: '#9370DB', recommended: true },
];

export default function ServiceFormModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [serviceData, setServiceData] = useState({
    title: '',
    description: '',
    district: '',
    location: '',
    category: '',
  });
  
  // Plan state
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  
  // Photos state
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // If modal closes, reset form
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setServiceData({
      title: '',
      description: '',
      district: '',
      location: '',
      category: '',
    });
    setSelectedPlan(PLANS[0]);
    setPhotos([]);
    setError("");
    setUploadProgress({});
  };

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({ ...prev, [name]: value }));
  };

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    // If user has more photos than new limit, trim them
    if (photos.length > plan.photoLimit) {
      setPhotos(prev => prev.slice(0, plan.photoLimit));
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = selectedPlan.photoLimit - photos.length;
    
    if (remainingSlots <= 0) {
      setError(`Maximum ${selectedPlan.photoLimit} photos allowed for ${selectedPlan.name} plan`);
      return;
    }
    
    const newFiles = files.slice(0, remainingSlots);
    setPhotos(prev => [...prev, ...newFiles]);
    setError("");
  };

  // Remove a photo
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Upload photos to backend (mock implementation - you'll need to implement actual upload)
  const uploadPhotosToServer = async (files) => {
    // This is a mock implementation
    // In real app, you would upload to cloud storage or your server
    const mockImageUrls = files.map((file, index) => 
      `https://mock-server.com/images/service-${Date.now()}-${index}.jpg`
    );
    
    // Simulate upload progress
    files.forEach((file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [index]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    });
    
    // Wait for all "uploads" to complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    return mockImageUrls;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Validate form
      if (!serviceData.title.trim() || !serviceData.description.trim()) {
        throw new Error("Title and description are required");
      }

      if (photos.length === 0) {
        throw new Error("Please upload at least one photo");
      }

      // 2. Upload photos (in real app, this would be actual upload)
      const imageUrls = await uploadPhotosToServer(photos);
      
      // 3. Prepare service data with images and plan
      const serviceWithImages = {
        ...serviceData,
        images: imageUrls,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price, // Optional: add plan price to service
      };

      // 4. Create service in backend
      const response = await createService(serviceWithImages);
      const createdService = response.data;

      // 5. Close modal and navigate to checkout
      onClose();
      
      // Navigate to checkout with service data and selected plan
      navigate("/payment/checkout", {
        state: {
          postData: createdService,
          selectedPlan: selectedPlan,
        }
      });

      // Optionally call success callback
      if (onSuccess) onSuccess(createdService);

    } catch (err) {
      setError(err.message || "Failed to create service. Please try again.");
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
          <h2>Create New Service</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {/* Left Column: Service Details */}
          <div className="form-columns">
            <div className="form-left">
              <h3>Service Details</h3>
              
              <div className="form-group">
                <label>Service Title *</label>
                <input
                  type="text"
                  name="title"
                  value={serviceData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Luxury Kandy Tour"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={serviceData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your service in detail..."
                  rows="4"
                  required
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
                  <option value="Colombo">Colombo</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Matara">Matara</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location (Google Maps URL) *</label>
                <input
                  type="url"
                  name="location"
                  value={serviceData.location}
                  onChange={handleInputChange}
                  placeholder="https://maps.google.com/..."
                  required
                />
              </div>
            </div>

            {/* Right Column: Plan Selection & Photos */}
            <div className="form-right">
              <h3>Visibility Plan</h3>
              
              {/* Plan Selection */}
              <div className="plan-selection">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-option ${selectedPlan.id === plan.id ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {plan.recommended && <span className="recommended-badge">Recommended</span>}
                    <h4>{plan.name}</h4>
                    <div className="plan-price">${plan.price}</div>
                    <div className="plan-features">
                      <div>📷 {plan.photoLimit} photos</div>
                      <div>✅ One-time payment</div>
                      {plan.id === 'premium' && <div>⭐ Top visibility</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo Upload Section */}
              <div className="photo-upload-section">
                <h4>Upload Photos ({photos.length}/{selectedPlan.photoLimit})</h4>
                
                <div className="upload-area">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={photos.length >= selectedPlan.photoLimit || loading}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="photo-upload" 
                    className={`upload-button ${photos.length >= selectedPlan.photoLimit ? 'disabled' : ''}`}
                  >
                    📁 Choose Photos
                  </label>
                  <p className="upload-hint">Drag & drop or click to upload (max {selectedPlan.photoLimit})</p>
                </div>

                {/* Photo Preview Grid */}
                {photos.length > 0 && (
                  <div className="photo-preview-grid">
                    {photos.map((file, index) => (
                      <div key={index} className="photo-preview-item">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index + 1}`} 
                        />
                        <div className="photo-overlay">
                          <span className="photo-index">{index + 1}</span>
                          <button 
                            type="button"
                            className="remove-photo"
                            onClick={() => removePhoto(index)}
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                        {uploadProgress[index] && (
                          <div className="upload-progress">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress[index]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Plan Limit Warning */}
                {photos.length >= selectedPlan.photoLimit && (
                  <div className="limit-warning">
                    ⚠️ Maximum {selectedPlan.photoLimit} photos reached for {selectedPlan.name} plan
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="form-error">{error}</div>}

          {/* Action Buttons */}
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
              disabled={loading || photos.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Proceed to Checkout ($${selectedPlan.price})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}