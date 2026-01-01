import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/AdminDashboard.css"; // Ensure this CSS file exists!

// --- Mock Data for Users (Since backend user endpoint isn't ready yet) ---
const mockUsers = [
    { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
    { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    
    // Data State
    const [users, setUsers] = useState(mockUsers);
    const [posts, setPosts] = useState([]); // 👈 Real Data will go here
    const [loading, setLoading] = useState(false);

    // 1. LOAD REAL DATA
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "ROLE_ADMIN") {
            navigate("/admin/login");
            return;
        }

        fetchServices();
    }, [navigate]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/services", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (err) {
            console.error("Failed to load services", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. HANDLE POST ACTIONS (Delete / Approve)
    const handlePostAction = async (postId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this post?`)) return;

        const token = localStorage.getItem("token");
        let url = `http://localhost:8080/api/services/${postId}`;
        let method = "DELETE"; // Default for delete
        let body = null;

        if (action === 'approve') {
            method = "PUT";
            body = JSON.stringify({ status: "APPROVED" });
        } else if (action === 'reject') {
            method = "PUT";
            body = JSON.stringify({ status: "REJECTED" });
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: body
            });

            if (res.ok) {
                alert(`Success: Post ${action}d`);
                fetchServices(); // Refresh the list
            } else {
                alert("Action failed");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    // --- RENDERERS ---

    const renderOverview = () => (
        <div className="overview-grid">
            <div className="stat-card total-users">
                <h3>Total Users</h3>
                <p>{users.length}</p>
            </div>
            <div className="stat-card active-posts">
                <h3>Live Services</h3>
                <p>{posts.filter(p => p.status === 'APPROVED').length}</p>
            </div>
            <div className="stat-card pending-review">
                <h3>Pending Review</h3>
                <p>{posts.filter(p => p.status === 'PENDING').length}</p>
            </div>
        </div>
    );

    const renderPostManagement = () => (
        <div className="table-container">
            <h3>Manage Service Posts ({posts.length})</h3>
            {loading ? <p>Loading data...</p> : (
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Provider</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post.id}>
                            <td>
                                <img 
                                  src={post.imageBase64 || post.images?.[0] || "https://via.placeholder.com/50"} 
                                  alt="img" 
                                  style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
                                />
                            </td>
                            <td>{post.title}</td>
                            <td>{post.category}</td>
                            <td>{post.providerId}</td>
                            <td>
                                <span className={`status-badge ${post.status ? post.status.toLowerCase() : 'pending'}`}>
                                    {post.status || 'PENDING'}
                                </span>
                            </td>
                            <td className="post-actions-cell">
                                <button 
                                    className="btn small btn-approve" 
                                    onClick={() => handlePostAction(post.id, 'approve')}
                                    disabled={post.status === 'APPROVED'}
                                >
                                    Approve
                                </button>
                                <button 
                                    className="btn small btn-danger" 
                                    onClick={() => handlePostAction(post.id, 'reject')}
                                    disabled={post.status === 'REJECTED'}
                                >
                                    Reject
                                </button>
                                <button 
                                    className="btn small btn-danger" 
                                    style={{marginLeft: '5px', background: '#dc3545'}}
                                    onClick={() => handlePostAction(post.id, 'delete')}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            )}
        </div>
    );

    return (
        <>
            <Navbar />
            <div className="admin-page-container">
                <aside className="admin-sidebar">
                    <h2>Admin Tools</h2>
                    <nav>
                        <button 
                            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            📊 Overview
                        </button>
                        <button 
                            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            📝 Post Management
                        </button>
                    </nav>
                </aside>

                <main className="admin-content">
                    <h1>{activeTab.toUpperCase()}</h1>
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "posts" && renderPostManagement()}
                </main>
            </div>
            <Footer />
        </>
    );
}


//http://localhost:5173/admin/login