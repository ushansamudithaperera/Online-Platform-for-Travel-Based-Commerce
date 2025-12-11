import React, { useState, useEffect } from "react"; 
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { createService, getProviderServices } from "../../api/serviceApi"; 


export default function ProviderDashboard() {
    const [showModal, setShowModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null); // State to hold the currently selected post object
    const [submissionError, setSubmissionError] = useState(null);
    const [loading, setLoading] = useState(true); 
    const nav = useNavigate();
    
    const [posts, setPosts] = useState([]); 
    
    const [newPostDetails, setNewPostDetails] = useState({
        title: '',
        description: '',
        district: '',
        location: '',
        category: '',
    });

    // FIX 2: Fetch provider's specific posts on component load
    useEffect(() => {
        async function fetchProviderPosts() {
            try {
                const response = await getProviderServices(); 
                setPosts(response.data); 
            } catch (error) {
                console.error("Failed to fetch provider posts:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProviderPosts();
    }, []); 

    // --- Data Submission and Handling Logic ---
    
    // Deletes the post (Client-side update only, API call needed in real app)
// In src/pages/Provider/ProviderDashboard.js

// 🚨 Ensure you import deleteService from your API file:
// import { createService, getProviderServices, deleteService } from "../../api/serviceApi";

const handleDelete = async (postId) => { // 🚨 Make the function ASYNC
    if (window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
        
        try {
            // 1. CRITICAL FIX: Call the DELETE API
            // This sends the DELETE request to the backend (e.g., DELETE /api/services/mongo-id-123)
            // The backend ServiceController handles authorization and database deletion.
            await deleteService(postId); 
            
            // 2. Update local state only AFTER the API call succeeds
            setPosts(prev => prev.filter(p => p.id !== postId));
            setSelectedPost(null); 
            console.log(`Successfully deleted post ${postId} from the database.`);

        } catch (error) {
            // Handle failure (e.g., if the user is unauthorized or the post doesn't exist)
            console.error("Failed to delete post:", error.response?.data || error.message);
            alert("Error: Could not delete post from the server.");
            // If the deletion fails, you might want to re-fetch the list: fetchProviderPosts();
        }
    }
};

    const handleModalChange = (e) => { 
        const { name, value } = e.target;
        setNewPostDetails(prev => ({ ...prev, [name]: value }));
    };

    // Handles the post creation flow
    const handleProceedToPlanSelection = async (e) => { 
        e.preventDefault();
        setSubmissionError(null);
        try {
            const response = await createService(newPostDetails); 
            const createdPost = response.data; 
            
            // CRITICAL: Update posts array and immediately select the new post for display
            setPosts(prev => [...prev, createdPost]);
            setSelectedPost(createdPost); // 🚨 Set the newly created post as selected

            setShowModal(false);
            nav("/payment/select-plan", { state: { postData: createdPost } }); 
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to save draft. Check network/validation.";
            setSubmissionError(errorMessage);
        }
    };

    // --- Render Block ---
    return (
        <>
            <Navbar />

            <div className="provider-container">
                
                {/* LEFT SIDE — MAIN DETAIL VIEW & HEADER */}
                <div className="provider-left">
                    <div className="provider-header">
                        <h2>Provider Dashboard</h2>

                        <button className="add-btn" onClick={() => {
                            setNewPostDetails({ title: '', description: '', district: '', location: '', category: '' }); 
                            setSubmissionError(null);
                            setShowModal(true);
                            setSelectedPost(null); // Clear selection when opening modal
                        }}>
                            + Add a Service 
                        </button>
                    </div>

                    {submissionError && <p style={{ color: 'red', padding: '10px' }}>⚠️ Error: {submissionError}</p>}
                    
                    {/* 🚨 CRITICAL FIX: RESTORED SELECTED POST DISPLAY LOGIC */}
                    {loading ? (
                        <p className="loading-msg">Loading dashboard data...</p>
                    ) : selectedPost ? (
                        // Show the selected post in the large tile
                        <div className="large-post">
                            {/* NOTE: p.images is an array, show the first one */}
                            <img src={selectedPost.images?.[0] || "/placeholder.png"} alt={selectedPost.title} />
                            <h3>{selectedPost.title}</h3>
                            <p>{selectedPost.description}</p>

                            <div className="action-buttons">
                                <button className="edit-btn">Edit Service</button>
                                <button 
                                    className="delete-btn" 
                                    onClick={() => handleDelete(selectedPost.id)}
                                >
                                    Delete Service
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="no-post-msg">Select a post from the right to preview it.</p>
                    )}
                </div>

                {/* RIGHT SIDE — RECENT POSTS LIST (Displays real data) */}
                <div className="provider-right">
                    <h3>Recent Posts ({posts.length})</h3>
                    <div className="post-list">
                        {loading ? (
                            <p>Loading your posts...</p>
                        ) : posts.length === 0 ? (
                            <p>No services posted yet. Click "Add a Service" to begin!</p>
                        ) : (
                            posts.map((p) => (
                                <div
                                    key={p.id}
                                    className={`post-tile ${selectedPost?.id === p.id ? 'active' : ''}`} // Highlight selected tile
                                    onClick={() => setSelectedPost(p)} // 🚨 CRITICAL: Set the selected post here
                                >
                                    <img src={p.images?.[0] || "/placeholder.png"} alt={p.title} />
                                    <div>
                                        <h4>{p.title}</h4>
                                        <p>{p.description}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL POPUP FORM (remains the same) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Add a New Service</h2>
                        <form className="modal-form" onSubmit={handleProceedToPlanSelection}>
                            
                            <label>Service Title</label>
                            <input type="text" placeholder="e.g. Kandy Full-Day Tour" name="title" value={newPostDetails.title} onChange={handleModalChange} required />

                            <label>Description</label>
                            <textarea placeholder="Describe your service..." name="description" value={newPostDetails.description} onChange={handleModalChange} required ></textarea>

                            <label>District</label>
                            <select name="district" value={newPostDetails.district} onChange={handleModalChange} required >
                                <option value="">Select District</option>
                                <option value="Kandy">Kandy</option>
                                <option value="Colombo">Colombo</option>
                                <option value="Galle">Galle</option>
                                <option value="Jaffna">Jaffna</option>
                            </select>

                            <label>Location (Google Maps Link)</label>
                            <input type="url" placeholder="Paste Google Maps URL…" name="location" value={newPostDetails.location} onChange={handleModalChange} required />

                            <label>Category</label>
                            <select name="category" value={newPostDetails.category} onChange={handleModalChange} required >
                                <option value="">Select Category</option>
                                <option value="Tour Guide">Tour Guide</option>
                                <option value="Driver">Driver</option>
                                <option value="Hotel">Hotel</option>
                                <option value="Experience">Experience</option>
                            </select>

                            <button type="submit" className="post-btn">
                                Select Plan & Add Photos
                            </button>

                            <button
                                type="button"
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <Footer/>
        </>
    );
}