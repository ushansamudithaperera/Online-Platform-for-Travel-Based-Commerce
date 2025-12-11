import React, { useState, useEffect } from "react"; 
import Navbar from "../../components/Navbar";
import "../../styles/TravellerDashboard.css";
import Footer from "../../components/Footer";
import { getAllServices } from "../../api/serviceApi"; 


export default function TravellerDashboard() {
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedPost, setSelectedPost] = useState(null); // State to hold the selected post object
    const [loading, setLoading] = useState(true); 

    // FIX 1: Posts state is initialized as empty, ready for API data
    const [posts, setPosts] = useState([]); 

    const categories = [ 
        { id: "tour_guide", name: "Tour Guides", img: "/images/cat-guide.jpg" },
        { id: "driver", name: "Drivers", img: "/images/cat-driver.jpg" },
        { id: "hotel", name: "Hotels", img: "/images/cat-hotel.jpg" },
        { id: "adventure", name: "Adventure", img: "/images/cat-adventure.jpg" },
    ];
    
    // Fetch data from backend on component mount
    useEffect(() => {
        async function fetchAllServices() {
            try {
                const response = await getAllServices(); 
                setPosts(response.data);
            } catch (error) {
                console.error("Failed to fetch public services:", error);
                setPosts([]); 
            } finally {
                setLoading(false);
            }
        }
        fetchAllServices();
    }, []); 

    // Function to handle search input
    const handleSearch = () => { 
        setSearch(searchTerm.toLowerCase()); 
    };

    // Filtering Logic (Case-Insensitive Search & Category Match)
    const filteredPosts = posts
        .filter((p) => (search ? p.title.toLowerCase().includes(search) : true))
        .filter((p) => (
            selectedCategory === "all" 
            ? true 
            : p.category.toLowerCase().replace(/ /g, '_') === selectedCategory.toLowerCase() 
        ))
        .filter((p) => (selectedDistrict === "all" ? true : p.district === selectedDistrict));

    return (
        <>
            <Navbar />

            <div className="traveller-container">

                {/* SEARCH BAR (Restored) */}
                <div className="search-section">
                    <div className="search-input-wrapper"> 
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search services"
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                        <button className="search-icon-btn" onClick={handleSearch}>
                            🔍 
                        </button>
                    </div>
                </div>

                {/* DISTRICT FILTER (Restored) */}
                <div className="filter-bar">
                    <select
                        className="filter-select"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                    >
                        <option value="all">All Districts</option>
                        <option value="Colombo">Colombo</option>
                        <option value="Kandy">Kandy</option>
                        <option value="Galle">Galle</option>
                    </select>
                </div>

                {/* CATEGORY SECTION (Restored) */}
                <div className="category-section">
                    <div className="category-grid">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-card ${selectedCategory === cat.id ? "active" : ""}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <img src={cat.img} alt={cat.name} />
                                <p className="category-name">{cat.name}</p>
                            </div>
                        ))}
                        <div
                            className={`category-card ${selectedCategory === "all" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("all")}
                        >
                            <img src="/images/all.jpg" alt="All" />
                            <p className="category-name">All</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT: TWO COLUMN LAYOUT */}
                <div className={`main-content ${selectedPost ? "show-two-column" : "single-column"}`}>

                    {/* 🚨 CRITICAL FIX: RESTORED LEFT PANE DETAIL VIEW */}
                    {selectedPost && (
                        <div className="selected-post">
                            <h2>{selectedPost.title}</h2>
                            <img src={selectedPost.images?.[0] || "/placeholder.png"} alt={selectedPost.title} />
                            <p>{selectedPost.description}</p>

                            {/* 🚨 RESTORED: REVIEW/RATING BOX */}
                            <div className="review-box">
                                <h3>Leave a Review</h3>
                                <select>
                                    <option>⭐ 1 Star</option>
                                    <option>⭐⭐ 2 Stars</option>
                                    <option>⭐⭐⭐ 3 Stars</option>
                                    <option>⭐⭐⭐⭐ 4 Stars</option>
                                    <option>⭐⭐⭐⭐⭐ 5 Stars</option>
                                </select>
                                <textarea placeholder="Write feedback..."></textarea>
                                <button className="btn">Submit Review</button>
                            </div>
                        </div>
                    )}

                    {/* RIGHT: POSTS LIST */}
                    <div className={`posts-section ${selectedPost ? "shrunk" : ""}`}>
                        {loading ? (
                            <p style={{ padding: '20px' }}>Loading services from the database...</p>
                        ) : filteredPosts.length === 0 ? (
                            <p className="no-results-error">😔 No services found.</p>
                        ) : (
                            filteredPosts.map((p) => (
                                <div 
                                    key={p.id} 
                                    className="post-card" 
                                    // 🚨 CRITICAL: Set the selected post state on click
                                    onClick={() => setSelectedPost(p)} 
                                >
                                    <img src={p.images?.[0] || "/placeholder.png"} alt={p.title} /> 
                                    <h4 className="post-title">{p.title}</h4>
                                    <p>{p.district}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}