import React, { useState, useEffect } from "react"; 
import Navbar from "../../components/Navbar";
import "../../styles/TravellerDashboard.css";
import Footer from "../../components/Footer";
import { getAllServices } from "../../api/serviceApi"; 
import { getWishlist, getWishlistIds, toggleWishlist } from "../../api/wishlistApi";
import { 
    createBooking, 
    getMyBookings, 
    cancelBooking, 
    createReview, 
    getServiceReviews,
    getMyReviews,
    deleteReview 
} from "../../api/travellerApi";
import { useAuth } from "../../context/AuthContext";
import {
    FaUmbrellaBeach,
    FaCar,
    FaHotel,
    FaHiking,
    FaGlobeAsia,
} from "react-icons/fa";


export default function TravellerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("services"); // services, favorites, bookings, reviews
    
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedPost, setSelectedPost] = useState(null); // State to hold the selected post object
    const [loading, setLoading] = useState(true); 

    // Wishlist / Favorites
    const [wishlistIds, setWishlistIds] = useState([]); // array of serviceIds
    const [favoritePosts, setFavoritePosts] = useState([]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    // Booking states
    const [bookings, setBookings] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        bookingDate: "",
        contactEmail: user?.email || "",
        contactPhone: "",
        message: ""
    });
    
    // Review states
    const [reviews, setReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [serviceReviews, setServiceReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ""
    }); 
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
        if (activeTab === "services") {
            fetchAllServices();
            fetchWishlistIds();
        }
        if (activeTab === "favorites") {
            fetchWishlist();
            fetchWishlistIds();
        }
        if (activeTab === "bookings") fetchMyBookings();
        if (activeTab === "reviews") fetchMyReviews();

        // avoid carrying a selection across tabs
        setSelectedPost(null);
    }, [activeTab]); 

    useEffect(() => {
        if (selectedPost && (activeTab === "services" || activeTab === "favorites")) {
            fetchServiceReviews(selectedPost.id);
        }
    }, [selectedPost, activeTab]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedPost?.id]);

    async function fetchAllServices() {
        try {
            setLoading(true);
            const response = await getAllServices(); 
            setPosts(response.data);
        } catch (error) {
            console.error("Failed to fetch public services:", error);
            setPosts([]); 
        } finally {
            setLoading(false);
        }
    }

    async function fetchWishlistIds() {
        try {
            const response = await getWishlistIds();
            const ids = Array.isArray(response.data) ? response.data : [];
            setWishlistIds(ids);
        } catch (error) {
            // user might not be logged in / token expired
            setWishlistIds([]);
        }
    }

    async function fetchWishlist() {
        try {
            setLoading(true);
            const response = await getWishlist();
            setFavoritePosts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch wishlist:", error);
            setFavoritePosts([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMyBookings() {
        try {
            setLoading(true);
            const response = await getMyBookings();
            setBookings(response.data);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMyReviews() {
        try {
            setLoading(true);
            const response = await getMyReviews();
            setMyReviews(response.data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
            setMyReviews([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchServiceReviews(serviceId) {
        try {
            const response = await getServiceReviews(serviceId);
            setServiceReviews(response.data);
        } catch (error) {
            console.error("Failed to fetch service reviews:", error);
            setServiceReviews([]);
        }
    }

    const handleBookService = () => {
        setShowBookingModal(true);
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        try {
            await createBooking({
                serviceId: selectedPost.id,
                ...bookingForm
            });
            alert("Booking created successfully!");
            setShowBookingModal(false);
            setBookingForm({
                bookingDate: "",
                contactEmail: user?.email || "",
                contactPhone: "",
                message: ""
            });
            fetchMyBookings();
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Failed to create booking");
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            try {
                await cancelBooking(bookingId);
                alert("Booking cancelled");
                fetchMyBookings();
            } catch (error) {
                console.error("Cancel failed:", error);
                alert("Failed to cancel booking");
            }
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            await createReview({
                serviceId: selectedPost.id,
                ...reviewForm
            });
            alert("Review submitted successfully!");
            setShowReviewModal(false);
            setReviewForm({ rating: 5, comment: "" });
            fetchServiceReviews(selectedPost.id);
        } catch (error) {
            console.error("Review submission failed:", error);
            alert("Failed to submit review");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
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
    };

    const handleSearch = () => {
        setSearch(searchTerm.toLowerCase());
    };

    const wishlistIdSet = new Set(wishlistIds);

    const handleToggleWishlist = async (e, serviceId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!serviceId) return;

        const wasLiked = wishlistIdSet.has(serviceId);
        // optimistic UI update
        setWishlistIds((prev) => {
            const prevSet = new Set(Array.isArray(prev) ? prev : []);
            if (wasLiked) prevSet.delete(serviceId);
            else prevSet.add(serviceId);
            return Array.from(prevSet);
        });

        if (activeTab === "favorites" && wasLiked) {
            setFavoritePosts((prev) => (Array.isArray(prev) ? prev.filter((p) => p?.id !== serviceId) : prev));
        }

        try {
            await toggleWishlist(serviceId);
        } catch (error) {
            // revert if server failed
            setWishlistIds((prev) => {
                const prevSet = new Set(Array.isArray(prev) ? prev : []);
                if (wasLiked) prevSet.add(serviceId);
                else prevSet.delete(serviceId);
                return Array.from(prevSet);
            });
            console.error("Wishlist toggle failed:", error);
        }
    };

    const getInitials = (name) => {
        const cleaned = String(name || "").trim();
        if (!cleaned) return "TR";
        const parts = cleaned.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || "T";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "R";
        return (first + last).toUpperCase();
    };

    const toPlainText = (html) => {
        if (!html) return "";
        return String(html)
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    const renderCardRating = (ratingValue, reviewCount) => {
        const value = Math.max(0, Math.min(5, Number(ratingValue) || 0));
        const count = Number(reviewCount) || 0;
        return (
            <div className="card-rating" aria-label={`Rated ${value} out of 5`}>
                <span className="card-rating-number">{value.toFixed(1)}</span>
                <span className="card-rating-stars" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} className={idx < Math.round(value) ? "star filled" : "star"}>★</span>
                    ))}
                </span>
                <span className="card-rating-count">({count})</span>
            </div>
        );
    };
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

    const visiblePosts = activeTab === "favorites" ? favoritePosts : filteredPosts;

    // Hybrid layout: list view when searching/filtering and no selection
    const isListView = activeTab === "services" && !selectedPost && (searchTerm.trim() !== "" || selectedCategory !== "all");

    return (
        <>
            <Navbar />

            <div className="traveller-container">
                {/* TABS */}
                <div className="tabs-section">
                    <button 
                        className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
                        onClick={() => setActiveTab("services")}
                    >
                        Browse Services
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "favorites" ? "active" : ""}`}
                        onClick={() => setActiveTab("favorites")}
                    >
                        My Favorites
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
                        onClick={() => setActiveTab("bookings")}
                    >
                        My Bookings
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                        onClick={() => setActiveTab("reviews")}

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

                {/* SERVICES / FAVORITES TAB */}
                {(activeTab === "services" || activeTab === "favorites") && (
                    <>
                        {activeTab === "services" && (
                            <>
                                {/* SEARCH BAR */}
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

                                {/* DISTRICT FILTER */}
                                <div className="filter-bar">
                                    <div className="filter-card">
                                        <div className="filter-card-label">District</div>
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
                                </div>

                                {/* CATEGORY SECTION */}
                                <div className="category-section">
                                    <div className="category-header">
                                        <div>
                                            <h3 className="category-title">Categories</h3>
                                            <p className="category-subtitle">Pick what you’re looking for</p>
                                        </div>
                                    </div>
                                    <div className="category-grid">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className={`category-card ${selectedCategory === cat.id ? "active" : ""}`}
                                                onClick={() => setSelectedCategory(cat.id)}
                                            >
                                                <div className="icon-wrapper" aria-hidden="true">
                                            <cat.icon className="category-icon" />
                                        </div>
                                        <p className="category-name">{cat.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "favorites" && (
                            <div className="category-section" style={{ marginTop: 0 }}>
                                <div className="category-header">
                                    <div>
                                        <h3 className="category-title">My Favorites</h3>
                                        <p className="category-subtitle">Services you’ve liked</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MAIN CONTENT: TWO COLUMN LAYOUT */}
                        <div className={`main-content ${selectedPost ? "show-two-column" : "single-column"}`}>
                            {/* LEFT PANE: Service Details */}
                            {selectedPost && (
                                <div className="selected-post">
                                    <button
                                        className="close-btn"
                                        onClick={() => {
                                            setSelectedPost(null);
                                            setActiveImageIndex(0);
                                        }}
                                    >
                                        ✕
                                    </button>
                                    <h2>{selectedPost.title}</h2>

                                    <div className="traveller-post-images">
                                        {selectedImages.length > 0 ? (
                                            <>
                                                <div className="traveller-image-main-wrapper">
                                                    <img
                                                        src={getImageUrl(selectedImages[activeImageIndex])}
                                                        alt={`${selectedPost.title} - Image ${activeImageIndex + 1}`}
                                                        className="traveller-main-image"
                                                    />
                                                    {selectedImages.length > 1 && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="traveller-gallery-nav prev"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    goToPrevImage();
                                                                }}
                                                            >
                                                                ‹
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="traveller-gallery-nav next"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    goToNextImage();
                                                                }}
                                                            >
                                                                ›
                                                            </button>
                                                        </>
                                                    )}
                                                    <div className="traveller-image-badge">
                                                        {activeImageIndex + 1} / {selectedImages.length}
                                                    </div>
                                                </div>

                                                {selectedImages.length > 1 && (
                                                    <div className="traveller-image-thumbnails">
                                                        {selectedImages.map((img, idx) => (
                                                            <button
                                                                key={`${selectedPost.id}-thumb-${idx}`}
                                                                type="button"
                                                                className={`traveller-thumb-wrapper ${
                                                                    idx === activeImageIndex ? "active" : ""
                                                                }`}
                                                                onClick={() => setActiveImageIndex(idx)}
                                                            >
                                                                <img
                                                                    src={getImageUrl(img)}
                                                                    alt={`${selectedPost.title} thumbnail ${idx + 1}`}
                                                                    className="traveller-thumbnail-image"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="traveller-no-image">
                                                <p>No images uploaded.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div dangerouslySetInnerHTML={{ __html: selectedPost.description }} />
                                    <p><strong>District:</strong> {selectedPost.district}</p>
                                    <p><strong>Location:</strong> {selectedPost.location}</p>
                                    
                                    <button className="btn book-btn" onClick={handleBookService}>
                                        📅 Book This Service
                                    </button>

                                    {/* Reviews Section */}
                                    <div className="review-section review-section-modern">
                                        <div className="review-header review-header-modern">
                                            <div className="review-header-left">
                                                <div className="review-title-row">
                                                    <h3 className="review-title">Reviews</h3>
                                                    <span className="review-count-badge">{serviceReviews.length}</span>
                                                </div>
                                                <p className="review-subtitle">
                                                    Real experiences from travellers
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="review-primary-btn"
                                                onClick={() => setShowReviewModal(true)}
                                            >
                                                Write review
                                            </button>
                                        </div>
                                        
                                        {serviceReviews.length === 0 ? (
                                            <div className="review-empty">
                                                <p className="review-empty-title">No reviews yet</p>
                                                <p className="review-empty-subtitle">
                                                    Be the first to share your experience.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="reviews-list review-grid">
                                                {serviceReviews.map((review) => (
                                                    <div key={review.id} className="review-card-modern">
                                                        <div className="review-card-top">
                                                            <div className="review-avatar" aria-hidden="true">
                                                                {getInitials(review.travellerName)}
                                                            </div>
                                                            <div className="review-meta">
                                                                <div className="review-name">
                                                                    {review.travellerName || "Traveller"}
                                                                </div>
                                                                <div className="review-date">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div className="review-rating">
                                                                {renderStars(review.rating)}
                                                            </div>
                                                        </div>
                                                        <p className="review-comment">{review.comment}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* RIGHT: Posts List */}
                            <div className={`posts-section ${selectedPost ? "shrunk" : ""} ${isListView ? "list-view" : ""}`}>
                                {loading ? (
                                    <p style={{ padding: '20px' }}>Loading services...</p>
                                ) : visiblePosts.length === 0 ? (
                                    <p className="no-results-error">
                                        {activeTab === "favorites" ? "No favorites yet." : "😔 No services found."}
                                    </p>
                                ) : (
                                    visiblePosts.map((p) => {
                                        const serviceId = p?.id || p?._id;
                                        const cardImages = (p.images || []).filter(Boolean);
                                        const collageImages = cardImages.slice(0, 4);
                                        const remainingCount = Math.max(0, cardImages.length - collageImages.length);
                                        const ratingValue = p.averageRating ?? p.rating ?? 0;
                                        const reviewCount = p.reviewCount ?? p.ratingsCount ?? 0;
                                        const isLiked = Boolean(serviceId && wishlistIdSet.has(serviceId));
                                        const plainDescription = toPlainText(p.description || "");
                                        const isLongDescription = plainDescription.length > 180;

                                        // ensure at least one cell so the card always has a visual
                                        const renderImages = collageImages.length ? collageImages : [null];

                                        return (
                                            <div
                                                key={serviceId}
                                                className="post-card"
                                                onClick={() => setSelectedPost(p)}
                                            >
                                                <div className="card-rating-badge">
                                                    {renderCardRating(ratingValue, reviewCount)}
                                                    <button
                                                        type="button"
                                                        className={`heart-btn ${isLiked ? "active" : ""}`}
                                                        aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                                                        onClick={(e) => handleToggleWishlist(e, serviceId)}
                                                    >
                                                        {isLiked ? "♥" : "♡"}
                                                    </button>
                                                </div>
                                                <div
                                                    className={`post-card-media ${
                                                        renderImages.length <= 1 ? "single" : "collage"
                                                    }`}
                                                >
                                                    {renderImages.map((img, idx) => {
                                                        const isLastCellWithOverlay =
                                                            remainingCount > 0 && idx === renderImages.length - 1;

                                                        return (
                                                            <div
                                                                key={`${p.id}-media-${idx}`}
                                                                className="post-card-media-cell"
                                                            >
                                                                <img
                                                                    src={getImageUrl(img)}
                                                                    alt={`${p.title} image ${idx + 1}`}
                                                                    className="post-card-media-image"
                                                                    loading="lazy"
                                                                />
                                                                {isLastCellWithOverlay && (
                                                                    <div className="post-card-more-overlay">
                                                                        +{remainingCount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="post-card-content">
                                                    <div className="post-card-header-row">
                                                        <h4 className="post-title">{p.title}</h4>
                                                    </div>

                                                    <div
                                                        className="post-card-description-preview"
                                                        dangerouslySetInnerHTML={{ __html: p.description || "" }}
                                                    />
                                                    {isListView && isLongDescription && (
                                                        <button
                                                            type="button"
                                                            className="see-more-link"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPost(p);
                                                            }}
                                                        >
                                                            See more
                                                        </button>
                                                    )}

                                                    <div className="post-card-footer">
                                                        <div className="post-card-subtitle">
                                                            <span className="post-card-district">{p.district}</span>
                                                            {p.category && (
                                                                <span className="post-card-category">
                                                                    {String(p.category).replace(/_/g, " ")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="view-details-btn"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* BOOKINGS TAB */}
                {activeTab === "bookings" && (
                    <div className="bookings-section">
                        <h2>My Bookings</h2>
                        {loading ? (
                            <p>Loading bookings...</p>
                        ) : bookings.length === 0 ? (
                            <p className="no-results-error">No bookings yet.</p>
                        ) : (
                            <div className="bookings-list">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="booking-card">
                                        <h3>{booking.serviceTitle}</h3>
                                        <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                                        <p><strong>Status:</strong> <span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span></p>
                                        <p><strong>Message:</strong> {booking.message}</p>
                                        <p><strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                                        {booking.status === "PENDING" && (
                                            <button 
                                                className="btn btn-danger" 
                                                onClick={() => handleCancelBooking(booking.id)}
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === "reviews" && (
                    <div className="reviews-section">
                        <h2>My Reviews</h2>
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