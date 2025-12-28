// src/pages/Admin/AdminDashboard.jsx

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/AdminDashboard.css";
// import adminApi from "../../api/adminApi"; // API functions would be here

// --- Mock Data ---
const mockUsers = [
    { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active', posts: 0 },
    { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active', posts: 5 },
    { id: 'u3', fullname: 'Charlie Banned', email: 'charlie@mail.com', role: 'traveller', status: 'Banned', posts: 0 },
    { id: 'u4', fullname: 'Dana Verified', email: 'dana@hotel.com', role: 'provider', status: 'Pending Review', posts: 10 },
];
const mockPosts = [
    { id: 'p1', title: 'Luxury Hotel Kandy', provider: 'Dana Verified', district: 'Kandy', plan: 'Premium Spotlight', status: 'Active' },
    { id: 'p2', title: 'Ella Hiking Guide', provider: 'Bob Provider', district: 'Ella', plan: 'Featured Visibility', status: 'Active' },
    { id: 'p3', title: 'Colombo City Tour', provider: 'Bob Provider', district: 'Colombo', plan: 'Standard Listing', status: 'Pending Payment' },
    { id: 'p4', title: 'Ancient Ruin Tour', provider: 'Fiona Guide', district: 'Anuradhapura', plan: 'Premium Spotlight', status: 'Banned' },
];
// --- End Mock Data ---


export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState(mockUsers);
    const [posts, setPosts] = useState(mockPosts);
    const [loading, setLoading] = useState(false);

    // Initial data load effect
    useEffect(() => {
        // In a real app:
        // loadData();
    }, []);

    // 🚨 User Management Actions
    const handleUserStatusChange = (userId, newStatus) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!window.confirm(`Are you sure you want to change status for ${userToUpdate.fullname} to ${newStatus}?`)) return;

        // Mock API call
        setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, status: newStatus } : u
        ));
    };

    // 🚨 Post Management Actions
    const handlePostAction = (postId, action) => {
        const postToUpdate = posts.find(p => p.id === postId);
        if (!window.confirm(`Confirm action: ${action} for post "${postToUpdate.title}"?`)) return;

        if (action === 'delete') {
            setPosts(prev => prev.filter(p => p.id !== postId));
        } else if (action === 'approve') {
            setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, status: 'Active' } : p
            ));
        } else if (action === 'ban') {
            setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, status: 'Banned' } : p
            ));
        }
    };

    // --- Tab Content Renderers ---

    const renderOverview = () => (
        <div className="overview-grid">
            <div className="stat-card total-users">
                <h3>Total Users</h3>
                <p>{users.length}</p>
            </div>
            <div className="stat-card active-posts">
                <h3>Active Posts</h3>
                <p>{posts.filter(p => p.status === 'Active').length}</p>
            </div>
            <div className="stat-card pending-review">
                <h3>Pending Posts</h3>
                <p>{posts.filter(p => p.status === 'Pending Payment').length}</p>
            </div>
            <div className="stat-card total-providers">
                <h3>Total Providers</h3>
                <p>{users.filter(u => u.role === 'provider').length}</p>
            </div>
        </div>
    );

    const renderUserManagement = () => (
        <div className="table-container">
            <h3>Manage Platform Users ({users.length})</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.fullname}</td>
                            <td>{user.email}</td>
                            <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                            <td><span className={`status-badge ${user.status.split(' ')[0].toLowerCase()}`}>{user.status}</span></td>
                            <td>
                                {user.status !== 'Banned' ? (
                                    <button 
                                        className="btn small btn-ban" 
                                        onClick={() => handleUserStatusChange(user.id, 'Banned')}
                                    >
                                        Ban
                                    </button>
                                ) : (
                                    <button 
                                        className="btn small btn-activate" 
                                        onClick={() => handleUserStatusChange(user.id, 'Active')}
                                    >
                                        Activate
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPostManagement = () => (
        <div className="table-container">
            <h3>Manage Service Posts ({posts.length})</h3>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Provider</th>
                        <th>District</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post.id}>
                            <td>{post.title}</td>
                            <td>{post.provider}</td>
                            <td>{post.district}</td>
                            <td><span className="plan-tag">{post.plan}</span></td>
                            <td><span className={`status-badge ${post.status.split(' ')[0].toLowerCase()}`}>{post.status}</span></td>
                            <td className="post-actions-cell">
                                {post.status !== 'Active' && post.status !== 'Banned' && (
                                    <button 
                                        className="btn small btn-approve" 
                                        onClick={() => handlePostAction(post.id, 'approve')}
                                    >
                                        Approve
                                    </button>
                                )}
                                <button 
                                    className="btn small btn-danger" 
                                    onClick={() => handlePostAction(post.id, 'delete')}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    // --- Main Dashboard Layout ---
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
                            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 User Management
                        </button>
                        <button 
                            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            📝 Post Management
                        </button>
                        {/* More tools here: Feedback, Reports, etc. */}
                        <button className="nav-item nav-logout" onClick={() => {/* logout logic here */}}>
                            🔒 Logout
                        </button>
                    </nav>
                </aside>

                <main className="admin-content">
                    <h1>{activeTab.toUpperCase()}</h1>
                    
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "users" && renderUserManagement()}
                    {activeTab === "posts" && renderPostManagement()}
                    
                </main>
            </div>
            <Footer />
        </>
    );
}