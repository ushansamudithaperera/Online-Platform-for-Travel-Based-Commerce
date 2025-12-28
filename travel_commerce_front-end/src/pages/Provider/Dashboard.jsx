// src/pages/Provider/ProviderDashboard.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import {
  getProviderServices,
  deleteService,
} from "../../api/serviceApi";
import ServiceFormModal from "../../components/ServiceFormModal";

const backendBaseUrl = "http://localhost:8080";

export default function ProviderDashboard() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [posts, setPosts] = useState([]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedPost]);

  useEffect(() => {
    fetchProviderPosts();
  }, []);

  const fetchProviderPosts = async () => {
    try {
      const response = await getProviderServices();
      const data = response.data || [];
      setPosts(data);
      if (!selectedPost && data.length > 0) {
        setSelectedPost(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch provider posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Error deleting service");
      }
    }
  };

  const handleServiceCreated = (newService) => {
    setPosts((prev) => [newService, ...prev]);
    setSelectedPost(newService);
  };

  const handleServiceUpdated = (updatedService) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedService.id ? updatedService : p))
    );
    setSelectedPost(updatedService);
  };

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

  return (
    <>
      <Navbar />

      <div className="provider-container">
        {/* LEFT SIDE */}
        <div className="provider-left">
          <div className="provider-header">
            <div>
              <h2>Provider Dashboard</h2>
              <p className="provider-subtitle">
                Manage your services, photos and visibility in one place.
              </p>
            </div>
            <button
              className="add-btn"
              onClick={() => setShowCreateModal(true)}
            >
              + Add New Service
            </button>
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
                          setLightboxIndex(activeImageIndex);
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
                    <h3>{selectedPost.title}</h3>
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
                </div>

                <p className="post-description">{selectedPost.description}</p>

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
                    Edit Service
                  </button>
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => handleDelete(selectedPost.id)}
                  >
                    Delete Service
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

        {/* RIGHT SIDE */}
        <div className="provider-right">
          <div className="services-header">
            <h3>My Services ({posts.length})</h3>
            <button
              className="refresh-btn"
              onClick={fetchProviderPosts}
              title="Refresh list"
            >
              ↻
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
                      <h4>{post.title}</h4>
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
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
              src={getImageUrl(selectedPost.images[lightboxIndex])}
              alt={`Image ${lightboxIndex + 1}`}
            />
            {selectedPost.images.length > 1 && (
              <div className="lightbox-nav">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === 0
                        ? selectedPost.images.length - 1
                        : prev - 1
                    )
                  }
                >
                  ‹
                </button>
                <span className="lightbox-counter">
                  {lightboxIndex + 1} / {selectedPost.images.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === selectedPost.images.length - 1 ? 0 : prev + 1
                    )
                  }
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
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleServiceCreated}
      />

      {/* EDIT SERVICE MODAL (same component, edit mode) */}
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