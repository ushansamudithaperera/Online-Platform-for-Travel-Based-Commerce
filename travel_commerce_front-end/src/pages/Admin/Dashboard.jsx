import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/AdminDashboard.css"; 

export default function AdminDashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    
    // Data State
    const [users, setUsers] = useState([]); 
    const [posts, setPosts] = useState([]); 
    const [reviews, setReviews] = useState([]);
    
    // 🟢 NEW: Search State
    const [searchTerm, setSearchTerm] = useState("");

    // 1. LOAD REAL DATA
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
    }, [navigate]);

    // --- FETCH FUNCTIONS (Keep exactly as they were) ---
    const fetchServices = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
            });
            if (res.ok) setPosts(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setReviews(await res.json());
        } catch (err) { console.error(err); }
    };

    // --- ACTION HANDLERS ---
    const handlePostAction = async (postId, action) => {
        const confirmed = await toast.confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Post`,
            message: `Are you sure you want to ${action} this post?`,
            type: action === 'delete' ? 'danger' : 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        });
        if (!confirmed) return;

        const postToUpdate = posts.find(p => p.id === postId);
        const token = localStorage.getItem("token");
        let url = `http://localhost:8080/api/services/${postId}`;
        let method = action === 'delete' ? "DELETE" : "PUT";
        let body = null;
        
        if (action === 'approve') body = JSON.stringify({ ...postToUpdate, status: "ACTIVE" });
        if (action === 'reject') body = JSON.stringify({ ...postToUpdate, status: "BANNED" });

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: body
            });

            if (res.ok) {
                if (action === 'delete') {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                    toast.success("Post deleted successfully");
                } else {
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: JSON.parse(body).status } : p));
                    toast.success(`Post ${action}d successfully`);
                }
            } else { toast.error("Action failed"); }
        } catch (err) { toast.error("Network error"); }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await toast.confirm({
            title: "Remove User",
            message: "Remove this user permanently? This cannot be undone.",
            type: "danger",
            confirmText: "Remove",
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
            }
            else toast.error("Failed to remove user");
        } catch (err) { toast.error("Network error"); }
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = await toast.confirm({
            title: "Delete Review",
            message: "Are you sure you want to delete this review?",
            type: "danger",
            confirmText: "Delete",
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
                toast.success("Review deleted successfully");
            }
            else toast.error("Failed to delete review");
        } catch (err) { toast.error("Network error"); }
    };

    // --- HELPER: SEARCH FILTER ---
    // This allows searching any table by Name, Title, or Email
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
                    padding: '10px', 
                    borderRadius: '5px', 
                    border: '1px solid #ddd', 
                    width: '100%', 
                    maxWidth: '400px'
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
                                    <div style={{fontWeight: 'bold'}}>{user.fullname}</div>
                                    <div style={{fontSize: '0.8rem', color: '#718096'}}>{user.email}</div>
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
                                        <img src={post.images?.[0] || "/placeholder.png"} alt="img" style={{width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover'}}/>
                                        <span style={{fontWeight: '500'}}>{post.title}</span>
                                    </div>
                                </td>
                                <td>{post.category}</td>
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
                                    <button onClick={() => handlePostAction(post.id, 'reject')} disabled={post.status === 'BANNED'} className="btn small" style={{background: '#ecc94b', opacity: post.status === 'BANNED' ? 0.5 : 1}} title="Reject">⚠️</button>
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
                                <td>{review.travellerName}</td>
                                <td style={{color: '#ed8936'}}>{"★".repeat(review.rating)}</td>
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
                    </nav>
                </aside>
                <main className="admin-content">
                    <h1>{activeTab.toUpperCase()}</h1>
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "users" && renderUserManagement()}
                    {activeTab === "posts" && renderPostManagement()}
                    {activeTab === "reviews" && renderReviewManagement()}
                </main>
            </div>
            <Footer />
        </>
    );
}

// final ui/ux touches above
//http://localhost:5173/admin/login 

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; 

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState([]); 
//     const [posts, setPosts] = useState([]); 
//     const [reviews, setReviews] = useState([]); // 🟢 NEW: Reviews State
//     const [loading, setLoading] = useState(false);

//     // 1. LOAD REAL DATA
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         // Load everything
//         fetchServices();
//         fetchUsers();
//         fetchReviews(); // 🟢 NEW: Load reviews
//     }, [navigate]);

//     // --- FETCH FUNCTIONS ---

//     const fetchServices = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
//                 method: 'GET',
//                 headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
//             });
//             if (res.ok) setPosts(await res.json());
//         } catch (err) { console.error(err); }
//     };

//     const fetchUsers = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:8080/api/users`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setUsers(await res.json());
//         } catch (err) { console.error(err); }
//     };

//     // 🟢 NEW: Fetch Reviews
//     const fetchReviews = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:8080/api/reviews`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setReviews(await res.json());
//         } catch (err) { console.error(err); }
//     };

//     // --- ACTION HANDLERS ---

//     const handlePostAction = async (postId, action) => {
//         const confirmMessage = action === 'delete' ? "Delete post?" : `Mark as ${action}?`;
//         if (!window.confirm(confirmMessage)) return;

//         const postToUpdate = posts.find(p => p.id === postId);
//         if (!postToUpdate && action !== 'delete') return;

//         const token = localStorage.getItem("token");
//         let url = `http://localhost:8080/api/services/${postId}`;
//         let method = action === 'delete' ? "DELETE" : "PUT";
        
//         let body = null;
//         if (action === 'approve') body = JSON.stringify({ ...postToUpdate, status: "ACTIVE" });
//         if (action === 'reject') body = JSON.stringify({ ...postToUpdate, status: "BANNED" });

//         try {
//             const res = await fetch(url, {
//                 method: method,
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: body
//             });

//             if (res.ok) {
//                 if (action === 'delete') {
//                     setPosts(prev => prev.filter(p => p.id !== postId));
//                 } else {
//                     setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: body ? JSON.parse(body).status : p.status } : p));
//                 }
//                 alert("Success!");
//             } else {
//                 alert("Action failed");
//             }
//         } catch (err) { alert("Network error"); }
//     };

//     const handleDeleteUser = async (userId) => {
//         if (!window.confirm("Remove this user?")) return;
//         const token = localStorage.getItem("token");
//         try {
//             const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 setUsers(prev => prev.filter(u => u.id !== userId));
//                 alert("User removed");
//             } else alert("Failed to remove user");
//         } catch (err) { alert("Network error"); }
//     };

//     // 🟢 NEW: Delete Review
//     const handleDeleteReview = async (reviewId) => {
//         if (!window.confirm("Delete this review?")) return;
//         const token = localStorage.getItem("token");
//         try {
//             const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 setReviews(prev => prev.filter(r => r.id !== reviewId));
//                 alert("Review deleted");
//             } else alert("Failed to delete review");
//         } catch (err) { alert("Network error"); }
//     };

//     // --- RENDERERS ---

//     const renderOverview = () => {
//         const totalTravellers = users.filter(u => u.role === 'ROLE_TRAVELLER').length;
//         const totalProviders = users.filter(u => u.role === 'ROLE_PROVIDER').length;
        
//         return (
//             <div className="overview-grid">
//                 <div className="stat-card total-users" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
//                     <h3>Total Users</h3>
//                     <p>{users.length}</p>
//                     <div style={{fontSize: '0.8rem', marginTop: '10px'}}>
//                         {totalTravellers} Travellers • {totalProviders} Providers
//                     </div>
//                 </div>
//                 <div className="stat-card active-posts">
//                     <h3>Live Services</h3>
//                     <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
//                 </div>
//                 {/* 🟢 NEW: Reviews Stat */}
//                 <div className="stat-card" style={{background: '#fff', borderLeft: '4px solid #f6ad55', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
//                     <h3 style={{margin: 0, color: '#718096', fontSize: '0.9rem', textTransform: 'uppercase'}}>Total Reviews</h3>
//                     <p style={{fontSize: '2rem', fontWeight: 'bold', margin: '10px 0 0', color: '#2d3748'}}>{reviews.length}</p>
//                 </div>
//             </div>
//         );
//     };

//     const renderUserManagement = () => (
//         <div className="table-container">
//             <h3>Manage Users ({users.length})</h3>
//             <table>
//                 <thead>
//                     <tr><th>Name</th><th>Role</th><th>Email</th><th>Actions</th></tr>
//                 </thead>
//                 <tbody>
//                     {users.map(user => (
//                         <tr key={user.id}>
//                             <td>{user.fullname}</td>
//                             <td>
//                                 <span className={`status-badge ${user.role === 'ROLE_ADMIN' ? 'admin' : user.role === 'ROLE_PROVIDER' ? 'provider' : 'traveller'}`} 
//                                       style={{
//                                           backgroundColor: user.role === 'ROLE_ADMIN' ? '#000' : user.role === 'ROLE_PROVIDER' ? '#e3f2fd' : '#f1f8e9',
//                                           color: user.role === 'ROLE_ADMIN' ? '#fff' : user.role === 'ROLE_PROVIDER' ? '#1976d2' : '#388e3c',
//                                           padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
//                                       }}>
//                                     {user.role.replace('ROLE_', '')}
//                                 </span>
//                             </td>
//                             <td>{user.email}</td>
//                             <td>
//                                 {user.role !== 'ROLE_ADMIN' && (
//                                     <button className="btn small btn-danger" onClick={() => handleDeleteUser(user.id)} style={{backgroundColor: '#ff4d4f', color: 'white'}}>Remove</button>
//                                 )}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );

//     const renderPostManagement = () => (
//         <div className="table-container">
//             <h3>Manage Service Posts ({posts.length})</h3>
//             <table>
//                 <thead>
//                     <tr><th>Title</th><th>Provider</th><th>Status</th><th>Actions</th></tr>
//                 </thead>
//                 <tbody>
//                     {posts.map(post => (
//                         <tr key={post.id}>
//                             <td>{post.title}</td>
//                             <td>{post.providerId}</td>
//                             <td><span className={`status-badge ${post.status?.toLowerCase()}`}>{post.status || 'PENDING'}</span></td>
//                             <td className="post-actions-cell">
//                                 <button className="btn small btn-approve" onClick={() => handlePostAction(post.id, 'approve')} disabled={post.status === 'ACTIVE'}>Approve</button>
//                                 <button className="btn small btn-danger" onClick={() => handlePostAction(post.id, 'reject')} disabled={post.status === 'BANNED'}>Reject</button>
//                                 <button className="btn small btn-danger" onClick={() => handlePostAction(post.id, 'delete')} style={{marginLeft: '5px', background: '#dc3545'}}>Delete</button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );

//     // 🟢 NEW: Render Reviews Table
//     const renderReviewManagement = () => (
//         <div className="table-container">
//             <h3>Manage Reviews ({reviews.length})</h3>
//             {reviews.length === 0 ? <p>No reviews found.</p> : (
//             <table>
//                 <thead>
//                     <tr><th>Traveller</th><th>Rating</th><th>Comment</th><th>Actions</th></tr>
//                 </thead>
//                 <tbody>
//                     {reviews.map(review => (
//                         <tr key={review.id}>
//                             <td>{review.travellerName || "Anonymous"}</td>
//                             <td style={{color: '#f6ad55', fontSize: '1.2rem'}}>{'★'.repeat(review.rating)}</td>
//                             <td>{review.comment}</td>
//                             <td>
//                                 <button className="btn small btn-danger" onClick={() => handleDeleteReview(review.id)} style={{backgroundColor: '#ff4d4f', color: 'white'}}>Delete</button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             )}
//         </div>
//     );

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
//                             📊 Overview
//                         </button>
//                         <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
//                             👥 Users
//                         </button>
//                         <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
//                             📝 Posts
//                         </button>
//                         {/* 🟢 NEW: Review Tab Button */}
//                         <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
//                             ⭐ Reviews
//                         </button>
//                     </nav>
//                 </aside>

//                 <main className="admin-content">
//                     <h1>{activeTab.toUpperCase()}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "users" && renderUserManagement()}
//                     {activeTab === "posts" && renderPostManagement()}
//                     {/* 🟢 NEW: Render Reviews */}
//                     {activeTab === "reviews" && renderReviewManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }


// with review tab added above



// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; 

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState([]); // 🟢 Now holding REAL data
//     const [posts, setPosts] = useState([]); 
//     const [loading, setLoading] = useState(false);

//     // 1. LOAD REAL DATA (Users & Services)
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         fetchServices();
//         fetchUsers(); // 🟢 Load users when dashboard opens
//     }, [navigate]);

//     // --- FETCH DATA FUNCTIONS ---

//     const fetchServices = async () => {
//         // (Keep existing fetchServices logic)
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
//                 method: 'GET',
//                 headers: { 
//                     Authorization: `Bearer ${token}`,
//                     'Cache-Control': 'no-cache, no-store'
//                 }
//             });
//             if (res.ok) {
//                 const data = await res.json();
//                 setPosts(data);
//             }
//         } catch (err) {
//             console.error("Failed to load services", err);
//         }
//     };

//     // 🟢 NEW: Fetch Real Users from Backend
//     const fetchUsers = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:8080/api/users`, {
//                 method: 'GET',
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 const data = await res.json();
//                 setUsers(data);
//             } else {
//                 console.error("Failed to fetch users");
//             }
//         } catch (err) {
//             console.error("Network error fetching users", err);
//         }
//     };

//     // --- ACTION HANDLERS ---

//     const handlePostAction = async (postId, action) => {
//         // (Keep your existing handlePostAction logic exactly as it was)
//         // ... paste your existing handlePostAction code here or use the one from previous step ...
//         // For brevity, I am summarizing it, but ensure you keep the full logic:
//         const confirmMessage = action === 'delete' ? "Delete post?" : `Mark as ${action}?`;
//         if (!window.confirm(confirmMessage)) return;

//         const postToUpdate = posts.find(p => p.id === postId);
//         if (!postToUpdate && action !== 'delete') return;

//         const token = localStorage.getItem("token");
//         let url = `http://localhost:8080/api/services/${postId}`;
//         let method = "DELETE";
//         let body = null;
//         let newStatus = null;

//         if (action === 'approve') {
//             method = "PUT";
//             newStatus = "ACTIVE";
//             body = JSON.stringify({ ...postToUpdate, status: newStatus });
//         } else if (action === 'reject') {
//             method = "PUT";
//             newStatus = "BANNED";
//             body = JSON.stringify({ ...postToUpdate, status: newStatus });
//         }

//         try {
//             const res = await fetch(url, {
//                 method: method,
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: body
//             });

//             if (res.ok) {
//                 if (action === 'delete') {
//                     setPosts(prev => prev.filter(p => p.id !== postId));
//                 } else {
//                     setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
//                 }
//                 fetchServices();
//             } else {
//                 alert("Action failed");
//             }
//         } catch (err) {
//             alert("Network error");
//         }
//     };

//     // 🟢 NEW: Handle User Deletion
//     const handleDeleteUser = async (userId) => {
//         if (!window.confirm("Are you sure you want to remove this user? This cannot be undone.")) return;

//         const token = localStorage.getItem("token");
//         try {
//             const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` }
//             });

//             if (res.ok) {
//                 alert("User removed successfully");
//                 // Optimistic Update
//                 setUsers(prev => prev.filter(u => u.id !== userId));
//             } else {
//                 const text = await res.text();
//                 alert(`Failed: ${text}`);
//             }
//         } catch (err) {
//             console.error(err);
//             alert("Network error deleting user");
//         }
//     };

//     // --- RENDERERS ---

//     const renderOverview = () => {
//         // 🟢 Calculate Real Stats
//         const totalTravellers = users.filter(u => u.role === 'ROLE_TRAVELLER').length;
//         const totalProviders = users.filter(u => u.role === 'ROLE_PROVIDER').length;
        
//         return (
//             <div className="overview-grid">
//                 <div className="stat-card total-users" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
//                     <h3>Total Users</h3>
//                     <p>{users.length}</p>
//                     <div style={{fontSize: '0.8rem', marginTop: '10px', opacity: 0.9}}>
//                         <span>🎒 {totalTravellers} Travellers</span> • <span>🏢 {totalProviders} Providers</span>
//                     </div>
//                 </div>
//                 <div className="stat-card active-posts">
//                     <h3>Live Services</h3>
//                     <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
//                 </div>
//                 <div className="stat-card pending-review">
//                     <h3>Pending Review</h3>
//                     <p>{posts.filter(p => p.status === 'PENDING').length}</p>
//                 </div>
//             </div>
//         );
//     };

//     // 🟢 NEW: Render User Management Table
//     const renderUserManagement = () => (
//         <div className="table-container">
//             <h3>Manage Users ({users.length})</h3>
//             <table>
//                 <thead>
//                     <tr>
//                         <th>Name</th>
//                         <th>Email</th>
//                         <th>Role</th>
//                         <th>Phone</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {users.map(user => (
//                         <tr key={user.id}>
//                             <td>
//                                 <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
//                                     <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
//                                         {user.fullname?.charAt(0) || "U"}
//                                     </div>
//                                     {user.fullname}
//                                 </div>
//                             </td>
//                             <td>{user.email}</td>
//                             <td>
//                                 <span className={`status-badge ${user.role === 'ROLE_ADMIN' ? 'admin' : user.role === 'ROLE_PROVIDER' ? 'provider' : 'traveller'}`} 
//                                       style={{
//                                           backgroundColor: user.role === 'ROLE_ADMIN' ? '#000' : user.role === 'ROLE_PROVIDER' ? '#e3f2fd' : '#f1f8e9',
//                                           color: user.role === 'ROLE_ADMIN' ? '#fff' : user.role === 'ROLE_PROVIDER' ? '#1976d2' : '#388e3c',
//                                           padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
//                                       }}>
//                                     {user.role.replace('ROLE_', '')}
//                                 </span>
//                             </td>
//                             <td>{user.telephone}</td>
//                             <td>
//                                 {user.role !== 'ROLE_ADMIN' && (
//                                     <button 
//                                         className="btn small btn-danger" 
//                                         onClick={() => handleDeleteUser(user.id)}
//                                         style={{backgroundColor: '#ff4d4f', color: 'white'}}
//                                     >
//                                         Remove
//                                     </button>
//                                 )}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );

//     const renderPostManagement = () => (
//         <div className="table-container">
//             <h3>Manage Service Posts ({posts.length})</h3>
//             {/* ... Keep your existing Post Table logic here ... */}
//             <table>
//                 <thead>
//                     <tr>
//                         <th>Image</th>
//                         <th>Title</th>
//                         <th>Provider</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {posts.map(post => (
//                         <tr key={post.id}>
//                             <td>
//                                 <img src={post.images?.[0] || "/placeholder.png"} alt="img" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}/>
//                             </td>
//                             <td>{post.title}</td>
//                             <td>{post.providerId}</td>
//                             <td><span className={`status-badge ${post.status?.toLowerCase()}`}>{post.status || 'PENDING'}</span></td>
//                             <td className="post-actions-cell">
//                                 <button className="btn small btn-approve" onClick={() => handlePostAction(post.id, 'approve')} disabled={post.status === 'ACTIVE'}>Approve</button>
//                                 <button className="btn small btn-danger" onClick={() => handlePostAction(post.id, 'reject')} disabled={post.status === 'BANNED'}>Reject</button>
//                                 <button className="btn small btn-danger" style={{marginLeft: '5px', background: '#dc3545'}} onClick={() => handlePostAction(post.id, 'delete')}>Delete</button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
//                             📊 Overview
//                         </button>
//                         <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
//                             👥 User Management
//                         </button>
//                         <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
//                             📝 Post Management
//                         </button>
//                     </nav>
//                 </aside>

//                 <main className="admin-content">
//                     <h1>{activeTab === 'users' ? 'User Management' : activeTab === 'posts' ? 'Post Management' : 'Overview'}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "users" && renderUserManagement()}
//                     {activeTab === "posts" && renderPostManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }





//=============================V2===============================//
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; 

// // --- Mock Data for Users ---
// const mockUsers = [
//     { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
//     { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
// ];

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState(mockUsers);
//     const [posts, setPosts] = useState([]); 
//     const [loading, setLoading] = useState(false);

//     // 1. LOAD REAL DATA
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         fetchServices();
//     }, [navigate]);

//     const fetchServices = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             // 🟢 FIX 1: Cache Busting (?t=timestamp)
//             // This forces the browser to get FRESH data every time, never using the cache.
//             const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
//                 method: 'GET',
//                 headers: { 
//                     Authorization: `Bearer ${token}`,
//                     'Cache-Control': 'no-cache, no-store, must-revalidate',
//                     'Pragma': 'no-cache',
//                     'Expires': '0'
//                 }
//             });

//             if (res.ok) {
//                 const data = await res.json();
//                 setPosts(data);
//             }
//         } catch (err) {
//             console.error("Failed to load services", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // 🚨 OPTIMIZED ACTION HANDLER (No Reload Needed)
//     const handlePostAction = async (postId, action) => {
//         // 1. Confirm the action
//         const confirmMessage = action === 'delete' 
//             ? "Are you sure you want to DELETE this post?" 
//             : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

//         if (!window.confirm(confirmMessage)) return;

//         // 2. Find local post data
//         const postToUpdate = posts.find(p => p.id === postId);

//         if (!postToUpdate && action !== 'delete') {
//             alert("Error: Could not find post data locally.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         let url = `http://localhost:8080/api/services/${postId}`;
//         let method = "DELETE";
//         let body = null;
//         let newStatus = null; // We track the new status for the UI update

//         // 3. Configure the Request
//         if (action === 'approve') {
//             method = "PUT";
//             newStatus = "ACTIVE";
//             body = JSON.stringify({ ...postToUpdate, status: newStatus }); 
//         } else if (action === 'reject') {
//             method = "PUT";
//             newStatus = "BANNED";
//             body = JSON.stringify({ ...postToUpdate, status: newStatus });
//         }

//         try {
//             const res = await fetch(url, {
//                 method: method,
//                 headers: { 
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}` 
//                 },
//                 body: body
//             });

//             if (res.ok) {
//                 // 🟢 FIX 2: Optimistic UI Update (Instant Feedback) ⚡
//                 // We manually update the local state immediately. 
//                 // The user sees the change INSTANTLY without waiting for a reload.
                
//                 if (action === 'delete') {
//                     // Remove from list
//                     setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
//                     alert("Success: Post DELETED!");
//                 } else {
//                     // Update status in list
//                     setPosts(currentPosts => currentPosts.map(p => 
//                         p.id === postId ? { ...p, status: newStatus } : p
//                     ));
//                     alert(`Success: Post marked as ${newStatus}!`);
//                 }

//                 // (Optional) We still fetch in background just to double-check sync
//                 fetchServices(); 
                
//             } else {
//                 const errText = await res.text();
//                 console.error("Failed:", errText);
//                 alert(`Action failed. Server said: ${errText}`);
//             }
//         } catch (err) {
//             console.error("Network error:", err);
//             alert("Network Error: Is the backend running?");
//         }
//     };

//     // --- RENDERERS ---

//     const renderOverview = () => (
//         <div className="overview-grid">
//             <div className="stat-card total-users">
//                 <h3>Total Users</h3>
//                 <p>{users.length}</p>
//             </div>
//             <div className="stat-card active-posts">
//                 <h3>Live Services</h3>
//                 <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
//             </div>
//             <div className="stat-card pending-review">
//                 <h3>Pending Review</h3>
//                 <p>{posts.filter(p => p.status === 'PENDING').length}</p>
//             </div>
//         </div>
//     );

//     const renderPostManagement = () => (
//         <div className="table-container">
//             <h3>Manage Service Posts ({posts.length})</h3>
//             {loading ? <p>Loading data...</p> : (
//             <table>
//                 <thead>
//                     <tr>
//                         <th>Image</th>
//                         <th>Title</th>
//                         <th>Category</th>
//                         <th>Provider</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {posts.map(post => (
//                         <tr key={post.id}>
//                             <td>
//                                 <img 
//                                   src={post.imageBase64 || post.images?.[0] || "https://via.placeholder.com/50"} 
//                                   alt="img" 
//                                   style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
//                                 />
//                             </td>
//                             <td>{post.title}</td>
//                             <td>{post.category}</td>
//                             <td>{post.providerId}</td>
//                             <td>
//                                 <span className={`status-badge ${post.status ? post.status.toLowerCase() : 'pending'}`}>
//                                     {post.status || 'PENDING'}
//                                 </span>
//                             </td>
//                             <td className="post-actions-cell">
//                                 <button 
//                                     className="btn small btn-approve" 
//                                     onClick={() => handlePostAction(post.id, 'approve')}
//                                     disabled={post.status === 'ACTIVE'}
//                                     style={{ opacity: post.status === 'ACTIVE' ? 0.5 : 1 }}
//                                 >
//                                     Approve
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     onClick={() => handlePostAction(post.id, 'reject')}
//                                     disabled={post.status === 'BANNED'}
//                                     style={{ opacity: post.status === 'BANNED' ? 0.5 : 1 }}
//                                 >
//                                     Reject
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     style={{marginLeft: '5px', background: '#dc3545'}}
//                                     onClick={() => handlePostAction(post.id, 'delete')}
//                                 >
//                                     Delete
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             )}
//         </div>
//     );

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button 
//                             className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('overview')}
//                         >
//                             📊 Overview
//                         </button>
//                         <button 
//                             className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('posts')}
//                         >
//                             📝 Post Management
//                         </button>
//                     </nav>
//                 </aside>

//                 <main className="admin-content">
//                     <h1>{activeTab.toUpperCase()}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "posts" && renderPostManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }
//=============================V2===============================//


// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; 

// // --- Mock Data for Users (User endpoint integration pending) ---
// const mockUsers = [
//     { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
//     { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
// ];

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState(mockUsers);
//     const [posts, setPosts] = useState([]); 
//     const [loading, setLoading] = useState(false);

//     // 1. LOAD REAL DATA
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         fetchServices();
//     }, [navigate]);

//     const fetchServices = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch("http://localhost:8080/api/services", {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 const data = await res.json();
//                 setPosts(data);
//             }
//         } catch (err) {
//             console.error("Failed to load services", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // 🚨 FINAL CORRECTED ACTION HANDLER
//     const handlePostAction = async (postId, action) => {
//         // 1. Confirm the action
//         const confirmMessage = action === 'delete' 
//             ? "Are you sure you want to DELETE this post?" 
//             : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

//         if (!window.confirm(confirmMessage)) return;

//         // 2. FIND THE EXISTING POST DATA
//         const postToUpdate = posts.find(p => p.id === postId);

//         if (!postToUpdate && action !== 'delete') {
//             alert("Error: Could not find post data locally.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         let url = `http://localhost:8080/api/services/${postId}`;
//         let method = "DELETE";
//         let body = null;

//         // 3. Configure the Request using THE CORRECT ENUM VALUES
//         if (action === 'approve') {
//             method = "PUT";
//             // ✅ FIX: The error message confirmed we MUST use "ACTIVE"
//             body = JSON.stringify({ ...postToUpdate, status: "ACTIVE" }); 
//         } else if (action === 'reject') {
//             method = "PUT";
//             // ✅ FIX: The error message confirmed we MUST use "BANNED"
//             body = JSON.stringify({ ...postToUpdate, status: "BANNED" });
//         }

//         try {
//             const res = await fetch(url, {
//                 method: method,
//                 headers: { 
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}` 
//                 },
//                 body: body
//             });

//             if (res.ok) {
//                 alert(`Success: Post marked as ${action === 'approve' ? 'ACTIVE' : 'BANNED'}!`);
                
//                 // Refresh data immediately
//                 fetchServices(); 
//             } else {
//                 const errText = await res.text();
//                 console.error("Failed:", errText);
//                 alert(`Action failed. Server said: ${errText}`);
//             }
//         } catch (err) {
//             console.error("Network error:", err);
//             alert("Network Error: Is the backend running?");
//         }
//     };
    
//     // // 🚨 FINAL CORRECTED ACTION HANDLER
//     // const handlePostAction = async (postId, action) => {
//     //     // 1. Confirm the action
//     //     const confirmMessage = action === 'delete' 
//     //         ? "Are you sure you want to DELETE this post?" 
//     //         : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

//     //     if (!window.confirm(confirmMessage)) return;

//     //     // 2. FIND THE EXISTING POST DATA (Crucial Fix 🛠️)
//     //     // We must retrieve the current title, image, etc., so we don't lose them during the update.
//     //     const postToUpdate = posts.find(p => p.id === postId);

//     //     if (!postToUpdate && action !== 'delete') {
//     //         alert("Error: Could not find post data locally.");
//     //         return;
//     //     }

//     //     const token = localStorage.getItem("token");
//     //     let url = `http://localhost:8080/api/services/${postId}`;
//     //     let method = "DELETE";
//     //     let body = null;

//     //     // 3. Configure the Request using FULL OBJECT
       
//     //     if (action === 'approve') {
//     //         method = "PUT";
//     //         // ✅ FIX: Spread (...postToUpdate) keeps the title/image, then we overwrite status to ACTIVE
//     //         body = JSON.stringify({ ...postToUpdate, status: "ACTIVE" }); 
//     //     } else if (action === 'reject') {
//     //         method = "PUT";
//     //         // ✅ FIX: Spread keeps data, status becomes BANNED
//     //         body = JSON.stringify({ ...postToUpdate, status: "BANNED" });
//     //     }

//     //     try {
//     //         const res = await fetch(url, {
//     //             method: method,
//     //             headers: { 
//     //                 "Content-Type": "application/json",
//     //                 Authorization: `Bearer ${token}` 
//     //             },
//     //             body: body
//     //         });

//     //         if (res.ok) {
//     //             alert(`Success: Post marked as ${action === 'approve' ? 'ACTIVE' : 'BANNED'}!`);
//     //             fetchServices(); // Refresh the list instantly
//     //         } else {
//     //             const errText = await res.text();
//     //             console.error("Failed:", errText);
//     //             alert(`Action failed. Server said: ${errText}`);
//     //         }
//     //     } catch (err) {
//     //         console.error("Network error:", err);
//     //         alert("Network Error: Is the backend running?");
//     //     }
//     // };

//     // --- RENDERERS ---

//     const renderOverview = () => (
//         <div className="overview-grid">
//             <div className="stat-card total-users">
//                 <h3>Total Users</h3>
//                 <p>{users.length}</p>
//             </div>
//             <div className="stat-card active-posts">
//                 <h3>Live Services</h3>
//                 {/* Count only posts where status is ACTIVE */}
//                 <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
//             </div>
//             <div className="stat-card pending-review">
//                 <h3>Pending Review</h3>
//                 <p>{posts.filter(p => p.status === 'PENDING').length}</p>
//             </div>
//         </div>
//     );

//     const renderPostManagement = () => (
//         <div className="table-container">
//             <h3>Manage Service Posts ({posts.length})</h3>
//             {loading ? <p>Loading data...</p> : (
//             <table>
//                 <thead>
//                     <tr>
//                         <th>Image</th>
//                         <th>Title</th>
//                         <th>Category</th>
//                         <th>Provider</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {posts.map(post => (
//                         <tr key={post.id}>
//                             <td>
//                                 <img 
//                                   src={post.imageBase64 || post.images?.[0] || "https://via.placeholder.com/50"} 
//                                   alt="img" 
//                                   style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
//                                 />
//                             </td>
//                             <td>{post.title}</td>
//                             <td>{post.category}</td>
//                             <td>{post.providerId}</td>
//                             <td>
//                                 <span className={`status-badge ${post.status ? post.status.toLowerCase() : 'pending'}`}>
//                                     {post.status || 'PENDING'}
//                                 </span>
//                             </td>
//                             <td className="post-actions-cell">
//                                 <button 
//                                     className="btn small btn-approve" 
//                                     onClick={() => handlePostAction(post.id, 'approve')}
//                                     disabled={post.status === 'ACTIVE'}
//                                 >
//                                     Approve
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     onClick={() => handlePostAction(post.id, 'reject')}
//                                     disabled={post.status === 'BANNED'}
//                                 >
//                                     Reject
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     style={{marginLeft: '5px', background: '#dc3545'}}
//                                     onClick={() => handlePostAction(post.id, 'delete')}
//                                 >
//                                     Delete
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             )}
//         </div>
//     );

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button 
//                             className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('overview')}
//                         >
//                             📊 Overview
//                         </button>
//                         <button 
//                             className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('posts')}
//                         >
//                             📝 Post Management
//                         </button>
//                     </nav>
//                 </aside>

//                 <main className="admin-content">
//                     <h1>{activeTab.toUpperCase()}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "posts" && renderPostManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }



//CORRECT FIXED APPROVE AND REJECT BUTTONS
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; // Ensure this CSS file exists!

// // --- Mock Data for Users (Since backend user endpoint isn't ready yet) ---
// const mockUsers = [
//     { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
//     { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
// ];

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState(mockUsers);
//     const [posts, setPosts] = useState([]); // 👈 Real Data will go here
//     const [loading, setLoading] = useState(false);

//     // 1. LOAD REAL DATA
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         fetchServices();
//     }, [navigate]);

//     const fetchServices = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch("http://localhost:8080/api/services", {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 const data = await res.json();
//                 setPosts(data);
//             }
//         } catch (err) {
//             console.error("Failed to load services", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // 🚨 FINAL CORRECTED ACTION HANDLER
//     const handlePostAction = async (postId, action) => {
//         // 1. Confirm the action
//         // We still show "Approve/Reject" to the human, but we send specific codes to the machine
//         const confirmMessage = action === 'delete' 
//             ? "Are you sure you want to DELETE this post?" 
//             : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

//         if (!window.confirm(confirmMessage)) return;

//         const token = localStorage.getItem("token");
//         let url = `http://localhost:8080/api/services/${postId}`;
//         let method = "DELETE";
//         let body = null;

//         // 2. Configure the Request using VALID BACKEND CODES
//         if (action === 'approve') {
//             method = "PUT";
//             // 🟢 FIX: Backend expects "ACTIVE" for approved posts
//             body = JSON.stringify({ status: "ACTIVE" }); 
//         } else if (action === 'reject') {
//             method = "PUT";
//             // 🟢 FIX: Backend expects "BANNED" for rejected posts
//             body = JSON.stringify({ status: "BANNED" });
//         }

//         try {
//             const res = await fetch(url, {
//                 method: method,
//                 headers: { 
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}` 
//                 },
//                 body: body
//             });

//             if (res.ok) {
//                 alert(`Success: Post marked as ${action === 'approve' ? 'ACTIVE' : 'BANNED'}!`);
//                 fetchServices(); // Refresh the list instantly
//             } else {
//                 const errText = await res.text();
//                 console.error("Failed:", errText);
//                 alert(`Action failed. Server said: ${errText}`);
//             }
//         } catch (err) {
//             console.error("Network error:", err);
//             alert("Network Error: Is the backend running?");
//         }
//     };

//     // // 🚨 UPDATED ACTION HANDLER
//     // const handlePostAction = async (postId, action) => {
//     //     // 1. Confirm the action
//     //     const confirmMessage = action === 'delete' 
//     //         ? "Are you sure you want to DELETE this post?" 
//     //         : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

//     //     if (!window.confirm(confirmMessage)) return;

//     //     const token = localStorage.getItem("token");
//     //     let url = `http://localhost:8080/api/services/${postId}`;
//     //     let method = "DELETE";
//     //     let body = null;

//     //     // 2. Configure the Request (The Fix is Here 👇)
//     //     if (action === 'approve') {
//     //         method = "PUT";
//     //         // 🟢 FIX: Send "APPROVED" (Uppercase) to match Java Enum
//     //         body = JSON.stringify({ status: "APPROVED" }); 
//     //     } else if (action === 'reject') {
//     //         method = "PUT";
//     //         // 🟢 FIX: Send "REJECTED" (Uppercase) to match Java Enum
//     //         body = JSON.stringify({ status: "REJECTED" });
//     //     }

//     //     try {
//     //         const res = await fetch(url, {
//     //             method: method,
//     //             headers: { 
//     //                 "Content-Type": "application/json",
//     //                 Authorization: `Bearer ${token}` 
//     //             },
//     //             body: body
//     //         });

//     //         if (res.ok) {
//     //             // Success!
//     //             alert(`Success: Post ${action.toUpperCase()}!`);
//     //             fetchServices(); // Refresh the list instantly
//     //         } else {
//     //             // Failure - Show exactly what the server said
//     //             const errText = await res.text();
//     //             console.error("Failed:", errText);
//     //             alert(`Action failed. Server said: ${errText}`);
//     //         }
//     //     } catch (err) {
//     //         console.error("Network error:", err);
//     //         alert("Network Error: Is the backend running?");
//     //     }
//     // };


//     // 2. HANDLE POST ACTIONS (Delete / Approve)
//     // const handlePostAction = async (postId, action) => {
//     //     if (!window.confirm(`Are you sure you want to ${action} this post?`)) return;

//     //     const token = localStorage.getItem("token");
//     //     let url = `http://localhost:8080/api/services/${postId}`;
//     //     let method = "DELETE"; // Default for delete
//     //     let body = null;

//     //     if (action === 'approve') {
//     //         method = "PUT";
//     //         body = JSON.stringify({ status: "APPROVED" });
//     //     } else if (action === 'reject') {
//     //         method = "PUT";
//     //         body = JSON.stringify({ status: "REJECTED" });
//     //     }

//     //     try {
//     //         const res = await fetch(url, {
//     //             method: method,
//     //             headers: { 
//     //                 "Content-Type": "application/json",
//     //                 Authorization: `Bearer ${token}` 
//     //             },
//     //             body: body
//     //         });

//     //         if (res.ok) {
//     //             alert(`Success: Post ${action}d`);
//     //             fetchServices(); // Refresh the list
//     //         } else {
//     //             alert("Action failed");
//     //         }
//     //     } catch (err) {
//     //         console.error("Error:", err);
//     //     }
//     // };

//     // --- RENDERERS ---

//     const renderOverview = () => (
//         <div className="overview-grid">
//             <div className="stat-card total-users">
//                 <h3>Total Users</h3>
//                 <p>{users.length}</p>
//             </div>
//             <div className="stat-card active-posts">
//                 <h3>Live Services</h3>
//                 <p>{posts.filter(p => p.status === 'APPROVED').length}</p>
//             </div>
//             <div className="stat-card pending-review">
//                 <h3>Pending Review</h3>
//                 <p>{posts.filter(p => p.status === 'PENDING').length}</p>
//             </div>
//         </div>
//     );

//     const renderPostManagement = () => (
//         <div className="table-container">
//             <h3>Manage Service Posts ({posts.length})</h3>
//             {loading ? <p>Loading data...</p> : (
//             <table>
//                 <thead>
//                     <tr>
//                         <th>Image</th>
//                         <th>Title</th>
//                         <th>Category</th>
//                         <th>Provider</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {posts.map(post => (
//                         <tr key={post.id}>
//                             <td>
//                                 <img 
//                                   src={post.imageBase64 || post.images?.[0] || "https://via.placeholder.com/50"} 
//                                   alt="img" 
//                                   style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
//                                 />
//                             </td>
//                             <td>{post.title}</td>
//                             <td>{post.category}</td>
//                             <td>{post.providerId}</td>
//                             <td>
//                                 <span className={`status-badge ${post.status ? post.status.toLowerCase() : 'pending'}`}>
//                                     {post.status || 'PENDING'}
//                                 </span>
//                             </td>
//                             <td className="post-actions-cell">
//                                 <button 
//                                     className="btn small btn-approve" 
//                                     onClick={() => handlePostAction(post.id, 'approve')}
//                                     disabled={post.status === 'APPROVED'}
//                                 >
//                                     Approve
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     onClick={() => handlePostAction(post.id, 'reject')}
//                                     disabled={post.status === 'REJECTED'}
//                                 >
//                                     Reject
//                                 </button>
//                                 <button 
//                                     className="btn small btn-danger" 
//                                     style={{marginLeft: '5px', background: '#dc3545'}}
//                                     onClick={() => handlePostAction(post.id, 'delete')}
//                                 >
//                                     Delete
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//             )}
//         </div>
//     );

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button 
//                             className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('overview')}
//                         >
//                             📊 Overview
//                         </button>
//                         <button 
//                             className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
//                             onClick={() => setActiveTab('posts')}
//                         >
//                             📝 Post Management
//                         </button>
//                     </nav>
//                 </aside>

//                 <main className="admin-content">
//                     <h1>{activeTab.toUpperCase()}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "posts" && renderPostManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }


