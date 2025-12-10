import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import "../../styles/ProviderDashboard.css";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";


export default function ProviderDashboard() {
    const [showModal, setShowModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const nav = useNavigate();

    // Promote dummyPosts to state
    const [posts, setPosts] = useState([
        { id: 1, title: "Kandy Tour Package", img: "/sample1.jpg", desc: "Full day city tour" },
        { id: 2, title: "Ella Hiking Guide", img: "/sample2.jpg", desc: "Adventure package" },
        { id: 3, title: "Galle Dutch Fort Walk", img: "/sample3.jpg", desc: "Historical experience" },
    ]);
    
    // 🚨 MODIFIED STATE: Store ALL non-photo/non-plan details here
    const [newPostDetails, setNewPostDetails] = useState({
        title: '', // Added title for clarity
        description: '',
        district: '',
        location: '',
        category: '',
    });

    const handleDelete = (postId) => {
        if (window.confirm("Are you sure you want to delete this service?")) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            setPosts(updatedPosts);
            setSelectedPost(null); 
        }
    };

    // 🚨 NEW/MODIFIED FUNCTION: Submits the initial details and proceeds to the Plan Selection page
    const handleProceedToPlanSelection = (e) => {
        e.preventDefault();
        
        // 1. Close the service details modal
        setShowModal(false);

        // 2. Navigate to the Plan Selection page
        nav("/payment/select-plan", { 
            state: { 
                postData: newPostDetails 
            } 
        }); 
        
        // 3. Reset temporary post details
        setNewPostDetails({
            title: '',
            description: '',
            district: '',
            location: '',
            category: '',
        });
    };

    // 🚨 NEW FUNCTION: Handles input changes in the modal form
    const handleModalChange = (e) => {
        const { name, value } = e.target;
        setNewPostDetails(prev => ({ ...prev, [name]: value }));
    };


    return (
        <>
            <Navbar />

            <div className="provider-container">
                {/* ... (Existing provider-left and provider-right content remains the same) ... */}
                
                {/* LEFT SIDE — MAIN DETAIL VIEW */}
                <div className="provider-left">
                    <div className="provider-header">
                        <h2>Provider Dashboard</h2>

                        <button className="add-btn" onClick={() => {
                            setNewPostDetails({ title: '', description: '', district: '', location: '', category: '' }); // Reset form
                            setShowModal(true);
                        }}>
                            + Add a Service
                        </button>
                    </div>

                    {selectedPost ? (
                        <div className="large-post">
                            <img src={selectedPost.img} alt="" />
                            <h3>{selectedPost.title}</h3>
                            <p>{selectedPost.desc}</p>

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

                {/* RIGHT SIDE — RECENT POSTS LIST */}
                <div className="provider-right">
                    <h3>Recent Posts</h3>

                    <div className="post-list">
                        {posts.map((p) => (
                            <div
                                key={p.id}
                                className="post-tile"
                                onClick={() => setSelectedPost(p)}
                            >
                                <img src={p.img} alt="" />
                                <div>
                                    <h4>{p.title}</h4>
                                    <p>{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL POPUP FORM - Only collects Post Details (not photos/plans) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">

                        <h2>Add a New Service</h2>

                        <form className="modal-form" onSubmit={handleProceedToPlanSelection}>
                            
                            <label>Service Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Kandy Full-Day Tour"
                                name="title"
                                value={newPostDetails.title}
                                onChange={handleModalChange}
                                required
                            />

                            <label>Description</label>
                            <textarea 
                                placeholder="Describe your service..." 
                                name="description"
                                value={newPostDetails.description}
                                onChange={handleModalChange}
                                required
                            ></textarea>

                            <label>District</label>
                            <select 
                                name="district"
                                value={newPostDetails.district}
                                onChange={handleModalChange}
                                required
                            >
                                <option value="">Select District</option>
                                <option value="Kandy">Kandy</option>
                                <option value="Colombo">Colombo</option>
                                <option value="Galle">Galle</option>
                                <option value="Jaffna">Jaffna</option>
                            </select>

                            <label>Location (Google Maps Link)</label>
                            <input
                                type="url"
                                placeholder="Paste Google Maps URL…"
                                name="location"
                                value={newPostDetails.location}
                                onChange={handleModalChange}
                                required
                            />

                            <label>Category</label>
                            <select
                                name="category"
                                value={newPostDetails.category}
                                onChange={handleModalChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Tour Guide">Tour Guide</option>
                                <option value="Driver">Driver</option>
                                <option value="Hotel">Hotel</option>
                                <option value="Experience">Experience</option>
                            </select>

                            {/* 🚨 BUTTON CHANGE: Submits the form and proceeds to Plan Selection */}
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