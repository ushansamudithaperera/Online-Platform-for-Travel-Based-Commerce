// src/pages/Provider/ProviderDashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import {
  getProviderServices,
  deleteService,
} from "../../api/serviceApi";
import { getProviderBookings, updateBookingStatus, deleteBooking } from "../../api/travellerApi";
import BookingDetailsCard from "../../components/BookingDetailsCard";
import ServiceFormModal from "../../components/ServiceFormModal";
import NotificationPanel from "../../components/NotificationPanel";
import { FaSyncAlt, FaEdit, FaTrashAlt } from "react-icons/fa";
import { useToast } from "../../context/ToastContext";

const backendBaseUrl =
  import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:8080";

// Standard display limit for service titles
const TITLE_MAX_LENGTH = 50;

const truncateTitle = (title) => {
  if (!title) return "";
  return title.length > TITLE_MAX_LENGTH
    ? title.slice(0, TITLE_MAX_LENGTH - 1) + "…"
    : title;
};

export default function ProviderDashboard() {
  const toast = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("services"); // services, bookings, preview
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [returnFormData, setReturnFormData] = useState(null);

  /* Auto-open create modal with pre-filled data when returning from checkout */
  useEffect(() => {
    if (location.state?.returnFormData) {
      setReturnFormData(location.state.returnFormData);
      setShowCreateModal(true);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [posts, setPosts] = useState([]);
  
  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Preview (View as Traveller) state
  const [previewSelectedPost, setPreviewSelectedPost] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [showFullDescription, setShowFullDescription] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.png";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    if (imagePath.startsWith("/")) {
      return `${backendBaseUrl}${imagePath}`;
    }
    return `${backendBaseUrl}/uploads/${imagePath}`;
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString();
  };

  const stripHtml = (html) =>
    html
      ? html
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  const images = selectedPost?.images || [];

  const goToPrevImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    setActiveImageIndex(0);
    setShowFullDescription(false);
  }, [selectedPost?.id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goToPrevImage(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goToNextImage(); }
      else if (e.key === "Escape") { e.preventDefault(); setLightboxOpen(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    if (activeTab === "services" || activeTab === "preview") {
      fetchProviderPosts();
    } else if (activeTab === "bookings") {
      fetchProviderBookings();
    }
  }, [activeTab]);

  const fetchProviderPosts = async () => {
    try {
      setLoading(true);
      const response = await getProviderServices();
      const data = response.data || [];
      setPosts(data);
      if (!selectedPost && data.length > 0) {
        setSelectedPost(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch provider posts:", error);
      toast.error("Failed to load your services. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await getProviderBookings();
      const data = response.data || [];
      setBookings(data);
      if (!selectedBooking && data.length > 0) {
        setSelectedBooking(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings. Please refresh the page.");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      toast.success("Booking status updated!");
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Error updating booking status");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirmed = await toast.confirm({
      title: "Delete Booking",
      message: "Are you sure you want to delete this booking?",
      type: "danger",
      confirmText: "Delete",
    });
    if (confirmed) {
      try {
        await deleteBooking(bookingId);
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        if (selectedBooking?.id === bookingId) setSelectedBooking(null);
        toast.success("Booking deleted!");
      } catch (error) {
        console.error("Failed to delete booking:", error);
        toast.error("Error deleting booking");
      }
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = await toast.confirm({
      title: "Delete Service",
      message: "Are you sure you want to delete this service?",
      type: "danger",
      confirmText: "Delete",
    });
    if (confirmed) {
      try {
        await deleteService(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
        toast.success("Service deleted!");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Error deleting service");
      }
    }
  };

  const handleServiceCreated = (newService) => {
    setPosts((prev) => [newService, ...prev]);
    setSelectedPost(newService);
    toast.success("Service created successfully!");
  };

  const handleServiceUpdated = (updatedService) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedService.id ? updatedService : p))
    );
    setSelectedPost(updatedService);
    // Toast is already shown in ServiceFormModal — no duplicate needed here
  };

  // Description + pricing helpers
  const priceFromText = selectedPost
    ? formatPrice(selectedPost.priceFrom)
    : null;
  const priceToText = selectedPost ? formatPrice(selectedPost.priceTo) : null;
  const hasPrice = !!(priceFromText || priceToText);

  const descriptionHtml = selectedPost?.description || "";
  const descriptionPlain = stripHtml(descriptionHtml);
  const descriptionTooLong = descriptionPlain.length > 180;

  // Rating preview
  const rating = selectedPost?.averageRating;
  const reviewCount = selectedPost?.reviewCount;
  const hasRating = rating !== undefined && rating !== null;

  return (
    <>
      <Navbar />

      <div className="provider-container">
        {/* TABS */}
        <div className="provider-tabs">
          <button
            className={`provider-tab-btn ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>
          <button
            className={`provider-tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            Bookings
          </button>
          <button
            className={`provider-tab-btn ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => { setActiveTab("preview"); setPreviewSelectedPost(null); }}
          >
            View as Traveller
          </button>
        </div>

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <>
            <div className="provider-left">
          <div className="provider-header">
            <div>
              <h2>My Services</h2>
              <p className="provider-subtitle">
                Manage your service listings, view bookings, and connect with travellers.
              </p>

            </div>
            <div className="provider-header-actions">
              <NotificationPanel />
              <button
                className="add-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + Add New Service
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading-msg">Loading dashboard data...</p>
          ) : selectedPost ? (
            <div className="large-post">
              {/* IMAGE GALLERY */}
              <div className="post-images">
                {images.length > 0 ? (
                  <>
                    <div className="image-main-wrapper">
                      <img
                        src={getImageUrl(images[activeImageIndex])}
                        alt={`${selectedPost.title} - Image ${
                          activeImageIndex + 1
                        }`}
                        className="main-image"
                        onClick={() => {
                          setLightboxOpen(true);
                        }}
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="gallery-nav prev"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToPrevImage();
                            }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="gallery-nav next"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToNextImage();
                            }}
                          >
                            ›
                          </button>
                        </>
                      )}
                      {images.length > 0 && (
                        <div className="image-badge">
                          {activeImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="image-thumbnails">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`thumb-wrapper ${
                              idx === activeImageIndex ? "active" : ""
                            }`}
                            onClick={() => setActiveImageIndex(idx)}
                          >
                            <img
                              src={getImageUrl(img)}
                              alt={`Thumbnail ${idx + 1}`}
                              className="thumbnail-image"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-image">
                    <p>No Image Available</p>
                    {selectedPost.id && <p>Service ID: {selectedPost.id}</p>}
                  </div>
                )}
              </div>

              {/* DETAILS */}
              <div className="post-details">
                <div className="post-header">
                  <div className="post-header-main">
                    <h3>{truncateTitle(selectedPost.title)}</h3>
                    <div className="post-header-tags">
                      <span className="category-chip">
                        {selectedPost.category}
                      </span>
                      <span className="district-chip">
                        {selectedPost.district}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`status-badge ${
                      selectedPost.status?.toLowerCase() || "pending"
                    }`}
                  >
                    {selectedPost.status || "PENDING"}
                  </span>
                  {/* 🟢 NEW: Admin Warning Message for Banned Posts */}
                  {selectedPost.status === 'BANNED' && selectedPost.adminMessage && (
                    <div style={{
                      margin: '15px 0',
                      padding: '12px',
                      backgroundColor: '#fff5f5',
                      borderLeft: '4px solid #e53e3e',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                      <div>
                        <strong style={{ color: '#c53030', display: 'block', marginBottom: '4px' }}>
                          Action Required
                        </strong>
                        <p style={{ margin: 0, color: '#2d3748', fontSize: '0.9rem' }}>
                          {selectedPost.adminMessage}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* 🟢 END OF WARNING BOX 🟢 */}
                </div>
                

                {/* INFO STRIP: price + rating preview + booking preview */}

                <div className="info-strip">
                  {hasPrice && (
                    <div className="price-highlight">
                      <span className="price-amount">
                        From {priceFromText} {selectedPost.currency || "LKR"}
                      </span>
                      {selectedPost.priceUnit && (
                        <span className="price-unit-chip">
                          {" "}{selectedPost.priceUnit}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="rating-preview">
                    {hasRating ? (
                      <>
                        <span className="rating-value">
                          ⭐ {rating.toFixed(1)}
                        </span>
                        <span className="rating-count">
                          ({reviewCount || 0} reviews)
                        </span>
                      </>
                    ) : (
                      <span className="rating-placeholder">
                        ⭐ No reviews yet — travellers will rate this service
                      </span>
                    )}
                  </div>

                  <div className="booking-preview">
                    <span className="booking-label">Booking ready</span>
                    <span className="booking-text">
                      Travellers can request or book this service from their
                      dashboard.
                    </span>
                  </div>
                </div>

                <h4 className="about-heading">About this service</h4>

                <div className="post-description description-body">
                  {/* PRICE DISPLAY - PROMINENT INLINE */}
                  {hasPrice && (
                    <div className="inline-price-display">
                      <strong>💰 Price:</strong>{" "}
                      <span className="price-highlight">
                        From {priceFromText} {selectedPost.currency || "LKR"}
                      </span>
                      {selectedPost.priceUnit && (
                        <span className="price-unit-text"> {selectedPost.priceUnit}</span>
                      )}
                    </div>
                  )}

                  {/* DESCRIPTION CONTENT */}
                  <div
                    className={
                      !showFullDescription && descriptionTooLong
                        ? "description-content clamped"
                        : "description-content"
                    }
                    dangerouslySetInnerHTML={{
                      __html:
                        descriptionHtml || "<p>No description provided yet.</p>",
                    }}
                  />
                </div>

                {descriptionTooLong && (
                  <button
                    type="button"
                    className="description-toggle"
                    onClick={() =>
                      setShowFullDescription((prev) => !prev)
                    }
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>
                )}

                <div className="post-meta">
                  <div className="meta-item">
                    <span className="meta-label">Category</span>
                    <span className="meta-value">
                      {selectedPost.category || "-"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">District</span>
                    <span className="meta-value">
                      {selectedPost.district || "-"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Plan</span>
                    <span className="meta-value plan-tag">
                      {selectedPost.planName || "Standard Listing"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Images</span>
                    <span className="meta-value">
                      {images.length} photo{images.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="meta-item meta-location">
                    <span className="meta-label">Location</span>
                    {selectedPost.location ? (
                      <a
                        href={selectedPost.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-link"
                      >
                        View on Google Maps
                      </a>
                    ) : (
                      <span className="meta-value">Not provided</span>
                    )}
                  </div>
                  <div className="meta-item meta-location">
                    <span className="meta-label">Booking Site</span>
                    {selectedPost.externalBookingUrl ? (
                      <a
                        href={selectedPost.externalBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-link"
                      >
                        🌐 Your Booking Site
                      </a>
                    ) : (
                      <span className="meta-value">Platform booking</span>
                    )}
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created</span>
                    <span className="meta-value">
                      {selectedPost.createdAt
                        ? new Date(
                            selectedPost.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="edit-btn"
                    type="button"
                    onClick={() => setShowEditModal(true)}
                  >
                    <FaEdit /> Edit Service
                  </button>
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => handleDelete(selectedPost.id)}
                  >
                    <FaTrashAlt /> Delete Service
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-post-selected">
              <h3>👈 Select a Service</h3>
              <p>
                Choose a service from the list to view details, update
                information or manage photos.
              </p>
              <button
                className="add-btn-secondary"
                onClick={() => setShowCreateModal(true)}
              >
                + Create Your First Service
              </button>
            </div>
          )}
        </div>

        <div className="provider-right">
          <div className="services-header">
            <h3>My Services ({posts.length})</h3>
            <button
              className="refresh-btn"
              onClick={fetchProviderPosts}
              title="Refresh list"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="services-list">
            {loading ? (
              <p>Loading services...</p>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <p>No services yet. Create your first one!</p>
                <button
                  className="add-btn-small"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Add Service
                </button>
              </div>
            ) : (
              posts.map((post) => {
                const img = post.images && post.images[0];
                const listPrice =
                  formatPrice(post.priceFrom ?? post.priceTo) || null;

                return (
                  <div
                    key={post.id}
                    className={`service-item ${
                      selectedPost?.id === post.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="service-image">
                      {img ? (
                        <img
                          src={getImageUrl(img)}
                          alt={post.title}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<div class="placeholder-img">📷</div>';
                          }}
                        />
                      ) : (
                        <div className="placeholder-img">📷</div>
                      )}
                    </div>
                    <div className="service-info">
                      <h4>{truncateTitle(post.title)}</h4>
                      <p className="service-category">{post.category}</p>
                      <div className="service-meta">
                        <span className="service-district">
                          {post.district}
                        </span>
                        <span
                          className={`service-status ${
                            post.status?.toLowerCase() || "pending"
                          }`}
                        >
                          {post.status || "PENDING"}
                        </span>
                        {post.images && post.images.length > 0 && (
                          <span className="image-count">
                            📸 {post.images.length}
                          </span>
                        )}
                        {listPrice && (
                          <span className="service-price">
                            {(post.currency || "LKR") + " " + listPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
            </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="provider-bookings">
            <div className="bookings-header">
              <div>
                <h2>Booking Requests & Confirmations</h2>
                <p className="bookings-subtitle">
                  Manage bookings from travellers. Set pricing details per booking,
                  confirm/complete/cancel bookings, and communicate with guests.
                </p>
              </div>
              <button
                className="refresh-btn"
                onClick={fetchProviderBookings}
                title="Refresh bookings"
              >
                <FaSyncAlt />
              </button>
            </div>

            <div className="bookings-content">
              {bookingsLoading ? (
                <p className="loading-msg">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No bookings yet. When travellers book your services, they'll appear here.</p>
                </div>
              ) : (
                <div className="bookings-grid">
                  {bookings.map((booking) => (
                    <BookingDetailsCard
                      key={booking.id}
                      booking={booking}
                      isProvider={true}
                      onStatusChange={handleBookingStatusChange}
                      onDeleteBooking={handleDeleteBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW AS TRAVELLER TAB */}
        {activeTab === "preview" && (
          <div className="preview-traveller-section">
            <div className="preview-header">
              <h2>View as Traveller</h2>
              <p className="preview-subtitle">
                This is how your services appear to travellers browsing the platform.
              </p>
            </div>

            {loading ? (
              <p className="loading-msg">Loading your services...</p>
            ) : (
              (() => {
                const approvedPosts = posts;
                if (approvedPosts.length === 0) {
                  return (
                    <div className="preview-empty">
                      <p>No services to preview. Create a service to see how it appears to travellers.</p>
                    </div>
                  );
                }

                const previewImages = previewSelectedPost?.images?.filter(Boolean) || [];

                return (
                  <div className={`preview-main-content ${previewSelectedPost ? "show-two-column" : ""}`}>

                    {/* LEFT: Detail view */}
                    {previewSelectedPost && (
                      <div className="preview-detail-pane">
                        <button
                          className="preview-close-btn"
                          onClick={() => { setPreviewSelectedPost(null); setPreviewImageIndex(0); }}
                        >
                          ✕
                        </button>
                        <h2>{previewSelectedPost.title}</h2>

                        {/* Image gallery */}
                        <div className="preview-images">
                          {previewImages.length > 0 ? (
                            <>
                              <div className="preview-image-main-wrapper">
                                <img
                                  src={getImageUrl(previewImages[previewImageIndex])}
                                  alt={`${previewSelectedPost.title} - Image ${previewImageIndex + 1}`}
                                  className="preview-main-image"
                                />
                                {previewImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      className="preview-gallery-nav prev"
                                      onClick={() => setPreviewImageIndex((i) => i === 0 ? previewImages.length - 1 : i - 1)}
                                    >‹</button>
                                    <button
                                      type="button"
                                      className="preview-gallery-nav next"
                                      onClick={() => setPreviewImageIndex((i) => i === previewImages.length - 1 ? 0 : i + 1)}
                                    >›</button>
                                  </>
                                )}
                                <div className="preview-image-badge">
                                  {previewImageIndex + 1} / {previewImages.length}
                                </div>
                              </div>
                              {previewImages.length > 1 && (
                                <div className="preview-thumbnails">
                                  {previewImages.map((img, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      className={`preview-thumb ${idx === previewImageIndex ? "active" : ""}`}
                                      onClick={() => setPreviewImageIndex(idx)}
                                    >
                                      <img src={getImageUrl(img)} alt={`Thumb ${idx + 1}`} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="preview-no-image"><p>No images uploaded.</p></div>
                          )}
                        </div>

                        {/* Price display */}
                        {previewSelectedPost.priceFrom && (
                          <div className="preview-inline-price">
                            <strong>💰 Price:</strong>{" "}
                            <span className="preview-price-amount">
                              From {Number(previewSelectedPost.priceFrom).toLocaleString()} {previewSelectedPost.currency || "LKR"}
                            </span>
                            {previewSelectedPost.priceUnit && (
                              <span className="preview-price-unit"> {previewSelectedPost.priceUnit}</span>
                            )}
                          </div>
                        )}

                        <div dangerouslySetInnerHTML={{ __html: previewSelectedPost.description }} />
                        <p><strong>District:</strong> {previewSelectedPost.district}</p>
                        <p>
                          <strong>Location:</strong>{" "}
                          {previewSelectedPost.location ? (
                            <a href={previewSelectedPost.location} target="_blank" rel="noreferrer noopener">
                              {previewSelectedPost.location}
                            </a>
                          ) : "—"}
                        </p>
                        
                        {previewSelectedPost.externalBookingUrl && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#e3f2fd',
                            borderLeft: '4px solid #2196f3',
                            borderRadius: '4px',
                            marginBottom: '16px'
                          }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#1565c0' }}>
                              <strong>🌐 External Booking:</strong> Travellers will be redirected to{" "}
                              <a 
                                href={previewSelectedPost.externalBookingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#1565c0', textDecoration: 'underline' }}
                              >
                                your booking site
                              </a>
                            </p>
                          </div>
                        )}

                        <button className="preview-book-btn" disabled>
                          📅 Book This Service
                        </button>
                        <p className="preview-note">Booking is disabled in preview mode.</p>
                      </div>
                    )}

                    {/* RIGHT: Cards grid */}
                    <div className={`preview-cards-grid ${previewSelectedPost ? "shrunk" : ""}`}>
                      {approvedPosts.map((p) => {
                        const cardImages = (p.images || []).filter(Boolean);
                        const collageImages = cardImages.slice(0, 4);
                        const remainingCount = Math.max(0, cardImages.length - collageImages.length);
                        const ratingValue = p.averageRating ?? 0;
                        const reviewCount = p.reviewCount ?? 0;
                        const renderImages = collageImages.length ? collageImages : [null];

                        return (
                          <div
                            key={p.id}
                            className="preview-post-card"
                            onClick={() => { setPreviewSelectedPost(p); setPreviewImageIndex(0); }}
                          >
                            <div className={`preview-card-media ${renderImages.length <= 1 ? "single" : "collage"}`}>
                              {renderImages.map((img, idx) => {
                                const isLastWithOverlay = remainingCount > 0 && idx === renderImages.length - 1;
                                return (
                                  <div key={idx} className="preview-card-media-cell">
                                    <img
                                      src={getImageUrl(img)}
                                      alt={`${p.title} image ${idx + 1}`}
                                      className="preview-card-media-image"
                                      loading="lazy"
                                    />
                                    {isLastWithOverlay && (
                                      <div className="preview-card-more-overlay">+{remainingCount}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="preview-card-content">
                              <h4 className="preview-card-title">{p.title}</h4>
                              {p.status && p.status !== "ACTIVE" && (
                                <span style={{
                                  display: "inline-block",
                                  fontSize: "0.7rem",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  marginBottom: "6px",
                                  fontWeight: 600,
                                  color: p.status === "PENDING" ? "#b45309" : "#dc2626",
                                  backgroundColor: p.status === "PENDING" ? "#fef3c7" : "#fee2e2",
                                }}>
                                  {p.status === "PENDING" ? "⏳ Pending Approval" : p.status}
                                </span>
                              )}

                              {p.priceFrom && (
                                <div className="preview-card-price-banner">
                                  <span className="preview-price-from">
                                    From {Number(p.priceFrom).toLocaleString()} {p.currency || "LKR"}
                                  </span>
                                  {p.priceUnit && <span className="preview-price-unit-badge">{" "}{p.priceUnit}</span>}
                                </div>
                              )}

                              <div className="preview-card-rating">
                                ⭐ {ratingValue > 0 ? ratingValue.toFixed(1) : "New"}{" "}
                                <span className="preview-review-count">({reviewCount} reviews)</span>
                              </div>

                              <div className="preview-card-footer">
                                <span className="preview-card-district">{p.district}</span>
                                {p.category && <span className="preview-card-category">{p.category}</span>}
                                <button type="button" className="preview-view-btn">View Details</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* IMAGE LIGHTBOX */}
      {lightboxOpen && selectedPost?.images?.length > 0 && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close"
              type="button"
              onClick={() => setLightboxOpen(false)}
            >
              ×
            </button>
            <img
              src={getImageUrl(images[activeImageIndex])}
              alt={`Image ${activeImageIndex + 1}`}
            />
            {images.length > 1 && (
              <div className="lightbox-nav">
                <button
                  type="button"
                  onClick={goToPrevImage}
                >
                  ‹
                </button>
                <span className="lightbox-counter">
                  {activeImageIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={goToNextImage}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      <ServiceFormModal
        mode="create"
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setReturnFormData(null); }}
        onSuccess={handleServiceCreated}
        initialFormData={returnFormData}
      />

      {/* EDIT SERVICE MODAL */}
      <ServiceFormModal
        mode="edit"
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialService={selectedPost}
        onUpdate={handleServiceUpdated}
      />

      <Footer />
    </>
  );
}