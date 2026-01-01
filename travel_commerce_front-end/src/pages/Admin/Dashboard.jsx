import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/AdminDashboard.css"; 

// --- Mock Data for Users ---
const mockUsers = [
    { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
    { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    
    // Data State
    const [users, setUsers] = useState(mockUsers);
    const [posts, setPosts] = useState([]); 
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
            // 🟢 FIX 1: Cache Busting (?t=timestamp)
            // This forces the browser to get FRESH data every time, never using the cache.
            const res = await fetch(`http://localhost:8080/api/services?t=${new Date().getTime()}`, {
                method: 'GET',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
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

    // 🚨 OPTIMIZED ACTION HANDLER (No Reload Needed)
    const handlePostAction = async (postId, action) => {
        // 1. Confirm the action
        const confirmMessage = action === 'delete' 
            ? "Are you sure you want to DELETE this post?" 
            : `Are you sure you want to mark this post as ${action.toUpperCase()}?`;

        if (!window.confirm(confirmMessage)) return;

        // 2. Find local post data
        const postToUpdate = posts.find(p => p.id === postId);

        if (!postToUpdate && action !== 'delete') {
            alert("Error: Could not find post data locally.");
            return;
        }

        const token = localStorage.getItem("token");
        let url = `http://localhost:8080/api/services/${postId}`;
        let method = "DELETE";
        let body = null;
        let newStatus = null; // We track the new status for the UI update

        // 3. Configure the Request
        if (action === 'approve') {
            method = "PUT";
            newStatus = "ACTIVE";
            body = JSON.stringify({ ...postToUpdate, status: newStatus }); 
        } else if (action === 'reject') {
            method = "PUT";
            newStatus = "BANNED";
            body = JSON.stringify({ ...postToUpdate, status: newStatus });
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
                // 🟢 FIX 2: Optimistic UI Update (Instant Feedback) ⚡
                // We manually update the local state immediately. 
                // The user sees the change INSTANTLY without waiting for a reload.
                
                if (action === 'delete') {
                    // Remove from list
                    setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                    alert("Success: Post DELETED!");
                } else {
                    // Update status in list
                    setPosts(currentPosts => currentPosts.map(p => 
                        p.id === postId ? { ...p, status: newStatus } : p
                    ));
                    alert(`Success: Post marked as ${newStatus}!`);
                }

                // (Optional) We still fetch in background just to double-check sync
                fetchServices(); 
                
            } else {
                const errText = await res.text();
                console.error("Failed:", errText);
                alert(`Action failed. Server said: ${errText}`);
            }
        } catch (err) {
            console.error("Network error:", err);
            alert("Network Error: Is the backend running?");
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
                <p>{posts.filter(p => p.status === 'ACTIVE').length}</p>
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
                                    disabled={post.status === 'ACTIVE'}
                                    style={{ opacity: post.status === 'ACTIVE' ? 0.5 : 1 }}
                                >
                                    Approve
                                </button>
                                <button 
                                    className="btn small btn-danger" 
                                    onClick={() => handlePostAction(post.id, 'reject')}
                                    disabled={post.status === 'BANNED'}
                                    style={{ opacity: post.status === 'BANNED' ? 0.5 : 1 }}
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


