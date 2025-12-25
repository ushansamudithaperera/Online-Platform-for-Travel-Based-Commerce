import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getAllServices, deleteService } from "../../api/serviceApi"; // 1. Import Service API
import axios from "../../api/axiosConfig"; // 2. Import Axios for custom updates
// import "../../styles/AdminDashboard.css"; // Uncomment if you have this file

// --- Mock Data for USERS only (Since we haven't built User Backend yet) ---
const mockUsers = [
    { id: 'u1', fullname: 'Alice Traveller', email: 'alice@mail.com', role: 'traveller', status: 'Active' },
    { id: 'u2', fullname: 'Bob Provider', email: 'bob@service.com', role: 'provider', status: 'Active' },
    { id: 'u3', fullname: 'Charlie Banned', email: 'charlie@mail.com', role: 'traveller', status: 'Banned' },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    
    // State for Real Data
    const [services, setServices] = useState([]); // Real Services from DB
    const [users, setUsers] = useState(mockUsers); // Mock Users (for now)
    const [loading, setLoading] = useState(true);

    // 1. Fetch Real Services on Load
    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await getAllServices();
            setServices(res.data);
        } catch (err) {
            console.error("Error loading services:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    // A. Handle User Actions (Mock for now)
    const handleUserStatusChange = (userId, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    };

    // B. Handle Post/Service Actions (REAL API)
    // B. Handle Post/Service Actions (REAL API)
    const handlePostAction = async (service, action) => {
        if (action === 'delete') {
            if (!window.confirm(`Permanently delete "${service.title}"?`)) return;
            try {
                // 🚨 FIX: Use axios directly so it includes the Admin Token
                await axios.delete(`/services/${service.id}`);
                
                // Update UI: Remove the deleted item from the list
                setServices(prev => prev.filter(p => p.id !== service.id));
                
                alert("Service deleted successfully!"); // Optional success message
            } catch (err) {
                console.error(err);
                alert("Failed to delete. Check console for details.");
            }
        } 
        else if (action === 'toggleStatus') {
            // ... (Keep your existing working toggleStatus code here) ...
             const newStatus = service.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
            
            // Optimistic UI Update (Update screen instantly)
            const updatedList = services.map(s => 
                s.id === service.id ? { ...s, status: newStatus } : s
            );
            setServices(updatedList);

            try {
                // Send update to Backend
                await axios.put(`/services/${service.id}`, { ...service, status: newStatus });
            } catch (err) {
                console.error(err);
                alert("Update failed. Are you an Admin?");
                fetchServices(); // Revert on error
            }
        }
    };

    // const handlePostAction = async (service, action) => {
    //     if (action === 'delete') {
    //         if (!window.confirm(`Permanently delete "${service.title}"?`)) return;
    //         try {
    //             await deleteService(service.id);
    //             // Update UI
    //             setServices(prev => prev.filter(p => p.id !== service.id));
    //         } catch (err) {
    //             alert("Failed to delete service.");
    //         }
    //     } 
    //     else if (action === 'toggleStatus') {
    //         // Logic: If Pending -> Active. If Active -> Pending.
    //         const newStatus = service.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
            
    //         // Optimistic UI Update (Update screen instantly)
    //         const updatedList = services.map(s => 
    //             s.id === service.id ? { ...s, status: newStatus } : s
    //         );
    //         setServices(updatedList);

    //         try {
    //             // Send update to Backend
    //             await axios.put(`/services/${service.id}`, { ...service, status: newStatus });
    //         } catch (err) {
    //             console.error(err);
    //             alert("Update failed. Are you an Admin?");
    //             fetchServices(); // Revert on error
    //         }
    //     }
    // };

    // --- Tab Content Renderers ---

    const renderOverview = () => (
        <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="card p-3 shadow-sm bg-light">
                <h3>Total Users</h3>
                <p className="fs-2 fw-bold">{users.length}</p>
            </div>
            <div className="card p-3 shadow-sm bg-success text-white">
                <h3>Active Posts</h3>
                <p className="fs-2 fw-bold">{services.filter(p => p.status === 'ACTIVE').length}</p>
            </div>
            <div className="card p-3 shadow-sm bg-warning text-dark">
                <h3>Pending Approval</h3>
                <p className="fs-2 fw-bold">{services.filter(p => p.status === 'PENDING').length}</p>
            </div>
            <div className="card p-3 shadow-sm bg-info text-white">
                <h3>Total Services</h3>
                <p className="fs-2 fw-bold">{services.length}</p>
            </div>
        </div>
    );

    const renderUserManagement = () => (
        <div className="table-container mt-4">
            <h3>Manage Users (Mock Data)</h3>
            <table className="table table-bordered table-hover">
                <thead className="table-dark">
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
                            <td>{user.role}</td>
                            <td>
                                <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td>
                                {user.status !== 'Banned' ? (
                                    <button className="btn btn-sm btn-danger" onClick={() => handleUserStatusChange(user.id, 'Banned')}>Ban</button>
                                ) : (
                                    <button className="btn btn-sm btn-success" onClick={() => handleUserStatusChange(user.id, 'Active')}>Activate</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPostManagement = () => (
        <div className="table-container mt-4">
            <h3>Manage Service Posts ({services.length})</h3>
            {loading ? <p>Loading services...</p> : (
                <table className="table table-bordered table-hover align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th style={{width: '60px'}}>Img</th>
                            <th>Title</th>
                            <th>District</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(post => (
                            <tr key={post.id}>
                                <td>
                                    <img 
                                        src={post.imageBase64 || "https://via.placeholder.com/50"} 
                                        alt="svc" 
                                        style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'4px'}}
                                    />
                                </td>
                                <td>
                                    <strong>{post.title}</strong><br/>
                                    <small className="text-muted">{post.providerId}</small>
                                </td>
                                <td>{post.district}</td>
                                <td><span className="badge bg-secondary">{post.category}</span></td>
                                <td>
                                    <span className={`badge ${post.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                        {post.status || 'PENDING'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className={`btn btn-sm me-2 ${post.status === 'ACTIVE' ? 'btn-outline-secondary' : 'btn-success'}`}
                                        onClick={() => handlePostAction(post, 'toggleStatus')}
                                    >
                                        {post.status === 'ACTIVE' ? 'Unpublish' : 'Approve'}
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handlePostAction(post, 'delete')}
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
            <div className="d-flex" style={{ minHeight: '80vh' }}>
                
                {/* SIDEBAR */}
                <aside className="bg-dark text-white p-3" style={{ width: '250px' }}>
                    <h4 className="mb-4 text-center">Admin Panel</h4>
                    <nav className="nav flex-column gap-2">
                        <button 
                            className={`btn text-start ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline-light'}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            📊 Overview
                        </button>
                        <button 
                            className={`btn text-start ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-light'}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 User Management
                        </button>
                        <button 
                            className={`btn text-start ${activeTab === 'posts' ? 'btn-primary' : 'btn-outline-light'}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            📝 Post Management
                        </button>
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-grow-1 p-4 bg-light">
                    <h2 className="mb-4 text-uppercase border-bottom pb-2">{activeTab}</h2>
                    
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "users" && renderUserManagement()}
                    {activeTab === "posts" && renderPostManagement()}
                </main>
            </div>
            <Footer />
        </>
    );
}