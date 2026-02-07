import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// 🟢 FIX: Import useToast here
import { useToast } from "../../context/ToastContext"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/AdminDashboard.css"; 

export default function AdminDashboard() {
    const navigate = useNavigate();
    // 🟢 FIX: Initialize the Toast Hook
    const { toast } = useToast(); 

    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]); 
    const [posts, setPosts] = useState([]); 
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. LOAD DATA
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

    // --- FETCH FUNCTIONS ---
    // const fetchServices = async () => {
    //     try {
    //         const token = localStorage.getItem("token");
    //         const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
    //             method: 'GET',
    //             headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
    //         });
    //         if (res.ok) setPosts(await res.json());
    //     } catch (err) { console.error(err); }
    // };

    const fetchServices = async () => {
        try {
            const token = localStorage.getItem("token");
            // 🟢 MODIFIED: Added '?mode=admin' so Admin sees ALL posts
            const res = await fetch(`http://localhost:8080/api/services?mode=admin&t=${new Date().getTime()}`, {
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

    // --- ACTION HANDLERS (Now using Toast! 🍞) ---
    const handlePostAction = async (postId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this post?`)) return;

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
                    toast.error("Service deleted!"); // 🟢 Red Toast
                } else {
                    const newStatus = JSON.parse(body).status;
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
                    if (newStatus === 'ACTIVE') toast.success("Service Approved!"); // 🟢 Green Toast
                    if (newStatus === 'BANNED') toast.warning("Service Rejected!"); // 🟢 Orange Toast
                }
            } else { 
                toast.error("Action failed"); 
            }
        } catch (err) { 
            toast.error("Network error"); 
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Remove this user permanently?")) return;
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
        if (!window.confirm("Delete this review?")) return;
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

//http://localhost:5173/admin/login 


//================================================================================
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import "../../styles/AdminDashboard.css"; 

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const toast = useToast();
//     const [activeTab, setActiveTab] = useState("overview");
    
//     // Data State
//     const [users, setUsers] = useState([]); 
//     const [posts, setPosts] = useState([]); 
//     const [reviews, setReviews] = useState([]);
    
//     // 🟢 NEW: Search State
//     const [searchTerm, setSearchTerm] = useState("");

//     // 1. LOAD REAL DATA
//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (!token || role !== "ROLE_ADMIN") {
//             navigate("/admin/login");
//             return;
//         }

//         fetchServices();
//         fetchUsers();
//         fetchReviews();
//     }, [navigate]);

//     // --- FETCH FUNCTIONS (Keep exactly as they were) ---
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
//         const confirmed = await toast.confirm({
//             title: `${action.charAt(0).toUpperCase() + action.slice(1)} Post`,
//             message: `Are you sure you want to ${action} this post?`,
//             type: action === 'delete' ? 'danger' : 'warning',
//             confirmText: action.charAt(0).toUpperCase() + action.slice(1),
//         });
//         if (!confirmed) return;

//         const postToUpdate = posts.find(p => p.id === postId);
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
//                     toast.success("Post deleted successfully");
//                 } else {
//                     setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: JSON.parse(body).status } : p));
//                     toast.success(`Post ${action}d successfully`);
//                 }
//             } else { toast.error("Action failed"); }
//         } catch (err) { toast.error("Network error"); }
//     };

//     const handleDeleteUser = async (userId) => {
//         const confirmed = await toast.confirm({
//             title: "Remove User",
//             message: "Remove this user permanently? This cannot be undone.",
//             type: "danger",
//             confirmText: "Remove",
//         });
//         if (!confirmed) return;
//         const token = localStorage.getItem("token");
//         try {
//             const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 setUsers(prev => prev.filter(u => u.id !== userId));
//                 toast.success("User removed successfully");
//             }
//             else toast.error("Failed to remove user");
//         } catch (err) { toast.error("Network error"); }
//     };

//     const handleDeleteReview = async (reviewId) => {
//         const confirmed = await toast.confirm({
//             title: "Delete Review",
//             message: "Are you sure you want to delete this review?",
//             type: "danger",
//             confirmText: "Delete",
//         });
//         if (!confirmed) return;
//         const token = localStorage.getItem("token");
//         try {
//             const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) {
//                 setReviews(prev => prev.filter(r => r.id !== reviewId));
//                 toast.success("Review deleted successfully");
//             }
//             else toast.error("Failed to delete review");
//         } catch (err) { toast.error("Network error"); }
//     };

//     // --- HELPER: SEARCH FILTER ---
//     // This allows searching any table by Name, Title, or Email
//     const filterData = (data, fields) => {
//         if (!searchTerm) return data;
//         return data.filter(item => 
//             fields.some(field => item[field]?.toLowerCase().includes(searchTerm.toLowerCase()))
//         );
//     };

//     // --- RENDERERS ---

//     const renderSearchBar = (placeholder) => (
//         <div style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
//             <input 
//                 type="text" 
//                 placeholder={placeholder}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{
//                     padding: '10px', 
//                     borderRadius: '5px', 
//                     border: '1px solid #ddd', 
//                     width: '100%', 
//                     maxWidth: '400px'
//                 }}
//             />
//             {searchTerm && (
//                 <button onClick={() => setSearchTerm("")} className="btn" style={{background: '#718096'}}>Clear</button>
//             )}
//         </div>
//     );

//     const renderOverview = () => (
//         <div className="overview-grid">
//             <div className="stat-card total-users" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
//                 <h3>Total Users</h3>
//                 <p>{users.length}</p>
//                 <div style={{fontSize: '0.8rem', marginTop: '10px', opacity: 0.9}}>
//                     <span>🎒 {users.filter(u => u.role === 'ROLE_TRAVELLER').length} Travellers</span> • 
//                     <span>🏢 {users.filter(u => u.role === 'ROLE_PROVIDER').length} Providers</span>
//                 </div>
//             </div>
//             <div className="stat-card active-posts" style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white'}}>
//                 <h3>Live Services</h3>
//                 <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
//             </div>
//             <div className="stat-card" style={{background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white'}}>
//                 <h3>Total Reviews</h3>
//                 <p>{reviews.length}</p>
//             </div>
//         </div>
//     );

//     const renderUserManagement = () => {
//         const filteredUsers = filterData(users, ['fullname', 'email', 'role']);
//         return (
//             <div className="table-container">
//                 <h3>Manage Users ({filteredUsers.length})</h3>
//                 {renderSearchBar("Search by name, email, or role...")}
//                 <table>
//                     <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Action</th></tr></thead>
//                     <tbody>
//                         {filteredUsers.map(user => (
//                             <tr key={user.id}>
//                                 <td>
//                                     <div style={{fontWeight: 'bold'}}>{user.fullname}</div>
//                                     <div style={{fontSize: '0.8rem', color: '#718096'}}>{user.email}</div>
//                                 </td>
//                                 <td>
//                                     <span className={`status-badge ${user.role === 'ROLE_ADMIN' ? 'admin' : user.role === 'ROLE_PROVIDER' ? 'provider' : 'traveller'}`}
//                                           style={{
//                                               background: user.role === 'ROLE_ADMIN' ? '#2d3748' : user.role === 'ROLE_PROVIDER' ? '#ebf8ff' : '#f0fff4',
//                                               color: user.role === 'ROLE_ADMIN' ? '#fff' : user.role === 'ROLE_PROVIDER' ? '#3182ce' : '#38a169',
//                                               padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold'
//                                           }}>
//                                         {user.role.replace('ROLE_', '')}
//                                     </span>
//                                 </td>
//                                 <td>{user.telephone || "N/A"}</td>
//                                 <td>
//                                     {user.role !== 'ROLE_ADMIN' && (
//                                         <button className="btn small" onClick={() => handleDeleteUser(user.id)} style={{background: '#e53e3e', color: 'white'}}>🗑 Remove</button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         );
//     };

//     const renderPostManagement = () => {
//         const filteredPosts = filterData(posts, ['title', 'category', 'providerId']);
//         return (
//             <div className="table-container">
//                 <h3>Manage Services ({filteredPosts.length})</h3>
//                 {renderSearchBar("Search by title or category...")}
//                 <table>
//                     <thead><tr><th>Service</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
//                     <tbody>
//                         {filteredPosts.map(post => (
//                             <tr key={post.id}>
//                                 <td>
//                                     <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
//                                         <img src={post.images?.[0] || "/placeholder.png"} alt="img" style={{width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover'}}/>
//                                         <span style={{fontWeight: '500'}}>{post.title}</span>
//                                     </div>
//                                 </td>
//                                 <td>{post.category}</td>
//                                 <td>
//                                     <span className={`status-badge ${post.status?.toLowerCase() || 'pending'}`}
//                                           style={{
//                                               padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold',
//                                               background: post.status === 'ACTIVE' ? '#c6f6d5' : post.status === 'BANNED' ? '#fed7d7' : '#feebc8',
//                                               color: post.status === 'ACTIVE' ? '#22543d' : post.status === 'BANNED' ? '#822727' : '#744210'
//                                           }}>
//                                         {post.status || 'PENDING'}
//                                     </span>
//                                 </td>
//                                 <td style={{display: 'flex', gap: '5px'}}>
//                                     <button onClick={() => handlePostAction(post.id, 'approve')} disabled={post.status === 'ACTIVE'} className="btn small" style={{background: '#48bb78', opacity: post.status === 'ACTIVE' ? 0.5 : 1}} title="Approve">✅</button>
//                                     <button onClick={() => handlePostAction(post.id, 'reject')} disabled={post.status === 'BANNED'} className="btn small" style={{background: '#ecc94b', opacity: post.status === 'BANNED' ? 0.5 : 1}} title="Reject">⚠️</button>
//                                     <button onClick={() => handlePostAction(post.id, 'delete')} className="btn small" style={{background: '#e53e3e'}} title="Delete">🗑</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         );
//     };

//     const renderReviewManagement = () => {
//         const filteredReviews = filterData(reviews, ['comment', 'travellerName']);
//         return (
//             <div className="table-container">
//                 <h3>Manage Reviews ({filteredReviews.length})</h3>
//                 {renderSearchBar("Search reviews...")}
//                 {filteredReviews.length === 0 ? <p>No reviews found.</p> : (
//                 <table>
//                     <thead><tr><th>Traveller</th><th>Rating</th><th>Comment</th><th>Action</th></tr></thead>
//                     <tbody>
//                         {filteredReviews.map(review => (
//                             <tr key={review.id}>
//                                 <td>{review.travellerName}</td>
//                                 <td style={{color: '#ed8936'}}>{"★".repeat(review.rating)}</td>
//                                 <td style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{review.comment}</td>
//                                 <td>
//                                     <button className="btn small" onClick={() => handleDeleteReview(review.id)} style={{background: '#e53e3e', color: 'white'}}>🗑 Delete</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 )}
//             </div>
//         );
//     };

//     return (
//         <>
//             <Navbar />
//             <div className="admin-page-container">
//                 <aside className="admin-sidebar">
//                     <h2>Admin Tools</h2>
//                     <nav>
//                         <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => {setActiveTab('overview'); setSearchTerm("");}}>📊 Overview</button>
//                         <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => {setActiveTab('users'); setSearchTerm("");}}>👥 Users</button>
//                         <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => {setActiveTab('posts'); setSearchTerm("");}}>📝 Services</button>
//                         <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => {setActiveTab('reviews'); setSearchTerm("");}}>⭐ Reviews</button>
//                     </nav>
//                 </aside>
//                 <main className="admin-content">
//                     <h1>{activeTab.toUpperCase()}</h1>
//                     {activeTab === "overview" && renderOverview()}
//                     {activeTab === "users" && renderUserManagement()}
//                     {activeTab === "posts" && renderPostManagement()}
//                     {activeTab === "reviews" && renderReviewManagement()}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }

// final ui/ux touches above
//http://localhost:5173/admin/login 
//----------------------------------------------------------------------------------------------------------------------------------------------




