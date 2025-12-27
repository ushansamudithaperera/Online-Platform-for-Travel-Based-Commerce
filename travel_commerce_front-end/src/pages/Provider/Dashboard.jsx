// src/pages/Provider/ProviderDashboard.jsx (Updated)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import { getProviderServices, deleteService } from "../../api/serviceApi";
import ServiceFormModal from "../../components/ServiceFormModal"; // NEW IMPORT

export default function ProviderDashboard() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // For the new modal
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  // Fetch provider's posts
  useEffect(() => {
    fetchProviderPosts();
  }, []);

  const fetchProviderPosts = async () => {
    try {
      const response = await getProviderServices();
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch provider posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle post deletion
  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        setSelectedPost(null);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Error deleting service");
      }
    }
  };

  // Handle modal success (post creation)
  const handleServiceCreated = (newService) => {
    // Add the new service to the list
    setPosts(prev => [newService, ...prev]);
    // Optionally select the new service
    setSelectedPost(newService);
  };

  return (
    <>
      <Navbar />

      <div className="provider-container">
        {/* LEFT SIDE — MAIN DETAIL VIEW */}
        <div className="provider-left">
          <div className="provider-header">
            <h2>Provider Dashboard</h2>
            <button 
              className="add-btn" 
              onClick={() => setShowModal(true)}
            >
              + Add New Service
            </button>
          </div>

          {loading ? (
            <p className="loading-msg">Loading dashboard data...</p>
          ) : selectedPost ? (
            <div className="large-post">
              <div className="post-images">
                {selectedPost.images && selectedPost.images.length > 0 ? (
                  <img 
                    src={selectedPost.images[0]} 
                    alt={selectedPost.title} 
                    className="main-image"
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                {selectedPost.images && selectedPost.images.length > 1 && (
                  <div className="image-thumbnails">
                    {selectedPost.images.slice(1, 4).map((img, idx) => (
                      <img key={idx} src={img} alt={`Thumb ${idx + 1}`} />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="post-details">
                <div className="post-header">
                  <h3>{selectedPost.title}</h3>
                  <span className={`status-badge ${selectedPost.status?.toLowerCase()}`}>
                    {selectedPost.status || 'PENDING'}
                  </span>
                </div>
                
                <p className="post-description">{selectedPost.description}</p>
                
                <div className="post-meta">
                  <div className="meta-item">
                    <span className="meta-label">Category:</span>
                    <span className="meta-value">{selectedPost.category}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">District:</span>
                    <span className="meta-value">{selectedPost.district}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Plan:</span>
                    <span className="meta-value plan-tag">{selectedPost.planName || 'Standard'}</span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => navigate(`/services/${selectedPost.id}/edit`)}
                  >
                    Edit Service
                  </button>
                  <button 
                    className="delete-btn" 
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
              <p>Choose a service from the list to view details and manage it.</p>
              <button 
                className="add-btn-secondary"
                onClick={() => setShowModal(true)}
              >
                + Create Your First Service
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE — SERVICES LIST */}
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
                  onClick={() => setShowModal(true)}
                >
                  + Add Service
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className={`service-item ${selectedPost?.id === post.id ? 'active' : ''}`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="service-image">
                    {post.images && post.images.length > 0 ? (
                      <img src={post.images[0]} alt={post.title} />
                    ) : (
                      <div className="placeholder-img">📷</div>
                    )}
                  </div>
                  <div className="service-info">
                    <h4>{post.title}</h4>
                    <p className="service-category">{post.category}</p>
                    <div className="service-meta">
                      <span className="service-district">{post.district}</span>
                      <span className={`service-status ${post.status?.toLowerCase()}`}>
                        {post.status || 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* NEW SERVICE FORM MODAL */}
      <ServiceFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleServiceCreated}
      />

      <Footer />
    </>
  );
}