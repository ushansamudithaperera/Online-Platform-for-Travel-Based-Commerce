import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import NotificationPanel from "../../components/NotificationPanel";
import { adminSendNotification } from "../../api/notificationApi";
import "../../styles/AdminDashboard.css"; 

export default function AdminDashboard() {
    const navigate = useNavigate();
    const toast = useToast(); 

    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]); 
    const [posts, setPosts] = useState([]); 
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [notifRecipientId, setNotifRecipientId] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [notifSending, setNotifSending] = useState(false);

    // 🟢 FIX: Wrap all fetch functions in useCallback
    const fetchServices = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/services?mode=admin&t=${new Date().getTime()}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
            });
            if (res.ok) setPosts(await res.json());
        } catch (err) {
            console.error(err);
            toast.error("Failed to load services");
        }
    }, [toast]);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        }
    }, [toast]);

    const fetchReviews = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setReviews(await res.json());
        } catch (err) {
            console.error(err);
            toast.error("Failed to load reviews");
        }
    }, [toast]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "ROLE_ADMIN") {
            navigate("/admin/login");
            return;
        }

        fetchServices();
        fetchUsers();
        fetchReviews();
    }, [navigate, fetchServices, fetchUsers, fetchReviews]);

    // --- ACTION HANDLERS ---
    const handlePostAction = async (postId, action, reason = null) => {
        const actionLabels = { delete: 'Delete', approve: 'Approve', reject: 'Reject' };
        const confirmed = await toast.confirm({
            title: `${actionLabels[action] || action} Service`,
            message: `Are you sure you want to ${action} this service? This action cannot be undone.`,
            type: action === 'delete' ? 'danger' : 'warning',
            confirmText: actionLabels[action] || 'Confirm',
        });
        if (!confirmed) return;

        const postToUpdate = posts.find(p => p.id === postId);
        const token = localStorage.getItem("token");
        let url = `http://localhost:8080/api/services/${postId}`;
        let method = action === 'delete' ? "DELETE" : "PUT";
        let body = null;
        
        if (action === 'approve') body = JSON.stringify({ ...postToUpdate, status: "ACTIVE" });
        if (action === 'reject') {
            body = JSON.stringify({ 
                ...postToUpdate, 
                status: "BANNED",
                rejectionReason: reason || "No reason provided" 
            });
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: body
            });

            if (res.ok) {
                if (action === 'delete') {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                    toast.error("Service deleted!"); 
                } else {
                    const newStatus = JSON.parse(body).status;
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
                    if (newStatus === 'ACTIVE') toast.success("Service Approved!"); 
                    if (newStatus === 'BANNED') toast.warning(`Service Rejected! Reason: ${reason || 'No reason'}`); 
                }
            } else { 
                toast.error("Action failed"); 
            }
        } catch (err) { 
            toast.error("Network error"); 
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await toast.confirm({
            title: 'Remove User',
            message: 'Are you sure you want to permanently remove this user? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Remove',
        });
        if (!confirmed) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                toast.success("User removed successfully");
            } else {
                toast.error("Failed to remove user");
            }
        } catch (err) { toast.error("Network error"); }
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = await toast.confirm({
            title: 'Delete Review',
            message: 'Are you sure you want to delete this review?',
            type: 'danger',
            confirmText: 'Delete',
        });
        if (!confirmed) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
                toast.success("Review deleted");
            } else {
                toast.error("Failed to delete review");
            }
        } catch (err) { toast.error("Network error"); }
    };

    // --- HELPER: Get category icon ---
    const getCategoryIcon = (category) => {
        const icons = {
            'ACCOMMODATION': '🏨',
            'TOUR': '🗺️',
            'TRANSPORT': '🚗',
            'FOOD': '🍽️',
            'ACTIVITY': '🎯',
            'GUIDE': '👨‍🏫',
            'PHOTOGRAPHY': '📸',
            'DEFAULT': '🏷️'
        };
        return icons[category?.toUpperCase()] || icons['DEFAULT'];
    };

    // --- FILTERS ---
    const filterData = (data, fields) => {
        if (!searchTerm) return data;
        return data.filter(item => 
            fields.some(field => item[field]?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    // --- RENDERERS ---
    const renderSearchBar = (placeholder) => (
        <div style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
            <input 
                type="text" 
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    padding: '10px', borderRadius: '5px', border: '1px solid #ddd', 
                    width: '100%', maxWidth: '400px'
                }}
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="btn" style={{background: '#718096'}}>Clear</button>
            )}
        </div>
    );

    const renderOverview = () => (
        <div className="overview-grid">
            <div className="stat-card total-users" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                <h3>Total Users</h3>
                <p>{users.length}</p>
                <div style={{fontSize: '0.8rem', marginTop: '10px', opacity: 0.9}}>
                    <span>🎒 {users.filter(u => u.role === 'ROLE_TRAVELLER').length} Travellers</span> • 
                    <span>🏢 {users.filter(u => u.role === 'ROLE_PROVIDER').length} Providers</span>
                </div>
            </div>
            <div className="stat-card active-posts" style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white'}}>
                <h3>Live Services</h3>
                <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
            </div>
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white'}}>
                <h3>Total Reviews</h3>
                <p>{reviews.length}</p>
            </div>
        </div>
    );

    const renderUserManagement = () => {
        const filteredUsers = filterData(users, ['fullname', 'email', 'role']);
        return (
            <div className="table-container">
                <h3>Manage Users ({filteredUsers.length})</h3>
                {renderSearchBar("Search by name, email, or role...")}
                <table>
                    <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Action</th></tr></thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                        {/* 🟢 NEW: User avatar with initials instead of image */}
                                        <div 
                                            style={{
                                                width: '40px', 
                                                height: '40px', 
                                                borderRadius: '50%',
                                                background: user.role === 'ROLE_ADMIN' ? '#2d3748' : user.role === 'ROLE_PROVIDER' ? '#3182ce' : '#38a169',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {user.fullname.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{fontWeight: 'bold'}}>{user.fullname}</div>
                                            <div style={{fontSize: '0.8rem', color: '#718096'}}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.role === 'ROLE_ADMIN' ? 'admin' : user.role === 'ROLE_PROVIDER' ? 'provider' : 'traveller'}`}
                                          style={{
                                              background: user.role === 'ROLE_ADMIN' ? '#2d3748' : user.role === 'ROLE_PROVIDER' ? '#ebf8ff' : '#f0fff4',
                                              color: user.role === 'ROLE_ADMIN' ? '#fff' : user.role === 'ROLE_PROVIDER' ? '#3182ce' : '#38a169',
                                              padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold'
                                          }}>
                                        {user.role.replace('ROLE_', '')}
                                    </span>
                                </td>
                                <td>{user.telephone || "N/A"}</td>
                                <td>
                                    {user.role !== 'ROLE_ADMIN' && (
                                        <button className="btn small" onClick={() => handleDeleteUser(user.id)} style={{background: '#e53e3e', color: 'white'}}>🗑 Remove</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPostManagement = () => {
        const filteredPosts = filterData(posts, ['title', 'category', 'providerId']);

        return (
            <div className="table-container">
                <h3>Manage Services ({filteredPosts.length})</h3>
                {renderSearchBar("Search by title or category...")}
                <table>
                    <thead><tr><th>Service</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filteredPosts.map(post => (
                            <tr key={post.id}>
                                <td>
                                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                        {/* 🟢 NEW: Category icon + Title instead of image */}
                                        <div style={{fontSize: '24px'}}>
                                            {getCategoryIcon(post.category)}
                                        </div>
                                        <div>
                                            <div style={{fontWeight: '500'}}>{post.title}</div>
                                            <div style={{fontSize: '0.75rem', color: '#718096'}}>ID: {post.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        background: '#f0f0f0',
                                        padding: '4px 10px',
                                        borderRadius: '5px',
                                        fontSize: '0.85rem'
                                    }}>
                                        {post.category || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${post.status?.toLowerCase() || 'pending'}`}
                                          style={{
                                              padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold',
                                              background: post.status === 'ACTIVE' ? '#c6f6d5' : post.status === 'BANNED' ? '#fed7d7' : '#feebc8',
                                              color: post.status === 'ACTIVE' ? '#22543d' : post.status === 'BANNED' ? '#822727' : '#744210'
                                          }}>
                                        {post.status || 'PENDING'}
                                    </span>
                                </td>
                                <td style={{display: 'flex', gap: '5px'}}>
                                    <button onClick={() => handlePostAction(post.id, 'approve')} disabled={post.status === 'ACTIVE'} className="btn small" style={{background: '#48bb78', opacity: post.status === 'ACTIVE' ? 0.5 : 1}} title="Approve">✅</button>
                                    
                                    <button 
                                        onClick={() => {
                                            const reason = window.prompt("Why are you banning this post? (e.g. 'Invalid Price')");
                                            if (reason) handlePostAction(post.id, 'reject', reason);
                                        }} 
                                        disabled={post.status === 'BANNED'} 
                                        className="btn small" 
                                        style={{background: '#ecc94b', opacity: post.status === 'BANNED' ? 0.5 : 1}} 
                                        title="Reject"
                                    >
                                        ⚠️
                                    </button>
                                    
                                    <button onClick={() => handlePostAction(post.id, 'delete')} className="btn small" style={{background: '#e53e3e'}} title="Delete">🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReviewManagement = () => {
        const filteredReviews = filterData(reviews, ['comment', 'travellerName']);
        return (
            <div className="table-container">
                <h3>Manage Reviews ({filteredReviews.length})</h3>
                {renderSearchBar("Search reviews...")}
                {filteredReviews.length === 0 ? <p>No reviews found.</p> : (
                <table>
                    <thead><tr><th>Traveller</th><th>Rating</th><th>Comment</th><th>Action</th></tr></thead>
                    <tbody>
                        {filteredReviews.map(review => (
                            <tr key={review.id}>
                                <td>
                                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                        {/* 🟢 NEW: Traveller avatar with initial */}
                                        <div 
                                            style={{
                                                width: '35px', 
                                                height: '35px', 
                                                borderRadius: '50%',
                                                background: '#667eea',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}
                                        >
                                            {review.travellerName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span>{review.travellerName}</span>
                                    </div>
                                </td>
                                <td style={{color: '#ed8936', fontWeight: 'bold'}}>{"★".repeat(review.rating)}</td>
                                <td style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{review.comment}</td>
                                <td>
                                    <button className="btn small" onClick={() => handleDeleteReview(review.id)} style={{background: '#e53e3e', color: 'white'}}>🗑 Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        );
    };

    const handleSendNotification = async () => {
        if (!notifRecipientId || !notifMessage.trim()) {
            toast.warning("Please select a user and enter a message");
            return;
        }
        setNotifSending(true);
        try {
            await adminSendNotification(notifRecipientId, notifMessage.trim());
            toast.success("Notification sent!");
            setNotifRecipientId("");
            setNotifMessage("");
        } catch (err) {
            console.error(err);
            toast.error("Failed to send notification");
        } finally {
            setNotifSending(false);
        }
    };

    const renderNotifications = () => {
        const nonAdminUsers = users.filter(u => u.role !== 'ROLE_ADMIN');
        return (
            <div className="table-container">
                <h3>📢 Send Notifications</h3>

                <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                    padding: '20px', marginBottom: '20px'
                }}>
                    <h4 style={{margin: '0 0 12px', color: '#334155'}}>Send to Specific User</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <select
                            value={notifRecipientId}
                            onChange={(e) => setNotifRecipientId(e.target.value)}
                            style={{
                                padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                fontSize: '14px', width: '100%', maxWidth: '400px'
                            }}
                        >
                            <option value="">-- Select User --</option>
                            {nonAdminUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.fullname} ({u.email}) - {u.role.replace('ROLE_', '')}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            placeholder="Type your notification message..."
                            rows={3}
                            style={{
                                padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                fontSize: '14px', resize: 'vertical', width: '100%', maxWidth: '600px'
                            }}
                        />
                        <button
                            onClick={handleSendNotification}
                            disabled={notifSending}
                            className="btn"
                            style={{
                                background: '#6366f1', color: 'white', padding: '10px 20px',
                                borderRadius: '8px', width: 'fit-content', opacity: notifSending ? 0.6 : 1
                            }}
                        >
                            {notifSending ? 'Sending...' : '📩 Send Notification'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <div className="admin-page-container">
                <aside className="admin-sidebar">
                    <h2>Admin Tools</h2>
                    <nav>
                        <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => {setActiveTab('overview'); setSearchTerm("");}}>📊 Overview</button>
                        <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => {setActiveTab('users'); setSearchTerm("");}}>👥 Users</button>
                        <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => {setActiveTab('posts'); setSearchTerm("");}}>📝 Services</button>
                        <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => {setActiveTab('reviews'); setSearchTerm("");}}>⭐ Reviews</button>
                        <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => {setActiveTab('notifications'); setSearchTerm("");}}>📢 Notifications</button>
                    </nav>
                </aside>
                <main className="admin-content">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <h1>{activeTab.toUpperCase()}</h1>
                        <NotificationPanel />
                    </div>
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "users" && renderUserManagement()}
                    {activeTab === "posts" && renderPostManagement()}
                    {activeTab === "reviews" && renderReviewManagement()}
                    {activeTab === "notifications" && renderNotifications()}
                </main>
            </div>
            <Footer />
        </>
    );
}