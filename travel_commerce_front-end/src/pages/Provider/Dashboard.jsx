// src/pages/Provider/ProviderDashboard.jsx (Updated)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import { getProviderServices, deleteService } from "../../api/serviceApi";
import ServiceFormModal from "../../components/ServiceFormModal";

const backendBaseUrl = "http://localhost:8080";

export default function ProviderDashboard() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  // Function to get full image URL
  // Function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // 1) Full URL already (use as-is)
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // 2) Relative path starting with "/"
    if (imagePath.startsWith("/")) {
      return `${backendBaseUrl}${imagePath}`;
    }

    // 3) Only a file name
    return `${backendBaseUrl}/uploads/${imagePath}`;
  };
  // Add this debug useEffect to check what data you're getting
  useEffect(() => {
    console.log("Selected post data:", selectedPost);
    if (selectedPost?.images) {
      console.log("Post images URLs:", selectedPost.images);
      // Test each image URL
      selectedPost.images.forEach((url, index) => {
        console.log(`Image ${index}: ${url}`);
        // Try to load image to see if it's accessible
        const img = new Image();
        img.onload = () => console.log(`Image ${index} loaded successfully`);
        img.onerror = () => console.log(`Image ${index} failed to load: ${url}`);
        img.src = getImageUrl(url);
      });
    }
  }, [selectedPost]);

  // Fetch provider's posts
  useEffect(() => {
    fetchProviderPosts();
  }, []);

  const fetchProviderPosts = async () => {
    try {
      console.log("Fetching provider posts...");
      const response = await getProviderServices();
      console.log("Posts received:", response.data);
      
      // Log image URLs for debugging
      response.data.forEach((post, index) => {
        console.log(`Post ${index} - ${post.title}:`, {
          images: post.images,
          imageCount: post.images?.length || 0
        });
      });
      
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
                  <>
                    <img 
                      src={getImageUrl(selectedPost.images[0])} 
                      alt={selectedPost.title} 
                      className="main-image"
                      onError={(e) => {
                        console.error("Failed to load image URL:", selectedPost.images[0]);
                        e.target.style.display = 'none';
                        // Show debug info
                        const debugDiv = document.createElement('div');
                        debugDiv.className = 'debug-info';
                        debugDiv.innerHTML = `
                          <p><strong>Failed to load image</strong></p>
                          <p>URL: ${selectedPost.images[0]}</p>
                          <p>Full URL: ${getImageUrl(selectedPost.images[0])}</p>
                          <p>Try opening this URL in new tab to test</p>
                        `;
                        e.target.parentElement.appendChild(debugDiv);
                      }}
                      onLoad={() => console.log("Main image loaded successfully")}
                    />
                    {selectedPost.images.length > 1 && (
                      <div className="image-thumbnails">
                        {selectedPost.images.slice(1, 4).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={getImageUrl(img)} 
                            alt={`Thumb ${idx + 1}`}
                            onError={(e) => {
                              console.error("Failed to load thumbnail:", img);
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => console.log(`Thumbnail ${idx} loaded successfully`)}
                          />
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
                  <div className="meta-item">
                    <span className="meta-label">Images:</span>
                    <span className="meta-value">{selectedPost.images?.length || 0} photos</span>
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
                  onClick={() => {
                    console.log("Selected post:", post);
                    console.log("Post images:", post.images);
                    setSelectedPost(post);
                  }}
                >
                  <div className="service-image">
                    {post.images && post.images.length > 0 ? (
                      <img 
                        src={getImageUrl(post.images[0])} 
                        alt={post.title}
                        onError={(e) => {
                          console.error("Failed to load list image:", post.images[0]);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="placeholder-img">📷</div>';
                        }}
                        onLoad={() => console.log("List image loaded successfully")}
                      />
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
                      {post.images && (
                        <span className="image-count">
                          📸 {post.images.length}
                        </span>
                      )}
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