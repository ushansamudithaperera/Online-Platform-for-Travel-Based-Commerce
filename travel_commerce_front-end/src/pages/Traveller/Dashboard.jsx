import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import "../../styles/TravellerDashboard.css";
import Footer from "../../components/Footer";


export default function TravellerDashboard() {
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // 🚨 NEW state for controlled search
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedPost, setSelectedPost] = useState(null);

    const categories = [
        { id: "tour_guide", name: "Tour Guides", img: "/images/cat-guide.jpg" },
        { id: "driver", name: "Drivers", img: "/images/cat-driver.jpg" },
        { id: "hotel", name: "Hotels", img: "/images/cat-hotel.jpg" },
        { id: "adventure", name: "Adventure", img: "/images/cat-adventure.jpg" },
    ];

    const [posts] = useState([
        {
            id: 1,
            title: "Best Colombo Tour Guide",
            category: "tour_guide",
            district: "Colombo",
            description: "City tour with 10+ years of experience",
            time: "2025-01-30T10:00:00",
            image: "/images/post1.jpg",
        },
        {
            id: 2,
            title: "Kandy Driver Service",
            category: "driver",
            district: "Kandy",
            description: "Friendly driver with AC car",
            time: "2025-01-31T09:00:00",
            image: "/images/post2.jpg",
        },
    ]);

    // Function to trigger search when icon is clicked or Enter is pressed
    const handleSearch = () => {
        setSearch(searchTerm); // Set the actual search term from the input value
    };

    // Filter posts using the official 'search' state
    const filteredPosts = posts
        .filter((p) => (search ? p.title.toLowerCase().includes(search.toLowerCase()) : true))
        .filter((p) => (selectedCategory === "all" ? true : p.category === selectedCategory))
        .filter((p) => (selectedDistrict === "all" ? true : p.district === selectedDistrict))
        .sort((a, b) => new Date(b.time) - new Date(a.time));

    return (
        <>
            <Navbar />

            <div className="traveller-container">

                {/* SEARCH BAR (Updated) */}
                <div className="search-section">
                    {/* 🚨 Wrapper div added for positioning input and icon */}
                    <div className="search-input-wrapper"> 
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search services"
                            value={searchTerm} // Use new state for input
                            onChange={(e) => setSearchTerm(e.target.value)} // Update new state
                            // 🚨 Search on Enter key press
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                        {/* 🚨 Search Icon Button */}
                        <button className="search-icon-btn" onClick={handleSearch}>
                            {/* You need a CSS/Font icon class (e.g., Font Awesome) or an SVG here. 
                                Using a simple text icon for now, assuming your CSS handles the look.
                            */}
                            🔍 
                        </button>
                    </div>
                </div>

                {/* DISTRICT FILTER */}
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

                {/* CATEGORY SECTION (No changes needed) */}
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

                    {/* LEFT: SELECTED POST (No changes needed) */}
                    {selectedPost && (
                        <div className="selected-post">
                            <h2>{selectedPost.title}</h2>
                            <img src={selectedPost.image} alt={selectedPost.title} />
                            <p>{selectedPost.description}</p>

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

                    {/* RIGHT: POSTS LIST (Error message added) */}
                    <div className={`posts-section ${selectedPost ? "shrunk" : ""}`}>
                        {/* 🚨 Error Display: Show message if no results */}
                        {filteredPosts.length === 0 ? (
                            <p className="no-results-error">
                                😔 No services found.
                            </p>
                        ) : (
                            filteredPosts.map((p) => (
                                <div key={p.id} className="post-card" onClick={() => setSelectedPost(p)}>
                                    <img src={p.image} alt={p.title} />
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