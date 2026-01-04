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

const backendBaseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || "http://localhost:8080";

export default function TravellerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("services"); // services, favorites, bookings, reviews
    
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [posts, setPosts] = useState([]);

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

    const categories = [
        { id: "tour_guide", name: "Tour Guides", icon: FaUmbrellaBeach },
        { id: "driver", name: "Drivers", icon: FaCar },
        { id: "hotel", name: "Hotels", icon: FaHotel },
        { id: "experience", name: "Experience", icon: FaHiking },
        { id: "all", name: "All", icon: FaGlobeAsia },
    ];

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "/placeholder.png";
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }
        if (imagePath.startsWith("/")) {
            return `${backendBaseUrl}${imagePath}`;
        }
        return `${backendBaseUrl}/uploads/${imagePath}`;
    };

    const selectedImages = selectedPost?.images || [];

    const goToPrevImage = () => {
        if (!selectedImages.length) return;
        setActiveImageIndex((prev) => (prev === 0 ? selectedImages.length - 1 : prev - 1));
    };

    const goToNextImage = () => {
        if (!selectedImages.length) return;
        setActiveImageIndex((prev) => (prev === selectedImages.length - 1 ? 0 : prev + 1));
    };
    
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
            try {
                await deleteReview(reviewId);
                alert("Review deleted");
                fetchMyReviews();
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete review");
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

    const renderStars = (ratingValue) => {
        const value = Math.max(0, Math.min(5, Number(ratingValue) || 0));
        return (
            <div className="review-stars" aria-label={`Rating ${value} out of 5`}>
                {Array.from({ length: 5 }).map((_, idx) => {
                    const starNumber = idx + 1;
                    const active = starNumber <= value;
                    return (
                        <span
                            key={starNumber}
                            className={`review-star ${active ? "active" : ""}`}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    );
                })}
            </div>
        );
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
                    >
                        My Reviews
                    </button>
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
                        {loading ? (
                            <p>Loading reviews...</p>
                        ) : myReviews.length === 0 ? (
                            <p className="no-results-error">No reviews yet.</p>
                        ) : (
                            <div className="my-reviews-list">
                                {myReviews.map((review) => (
                                    <div key={review.id} className="review-card-modern">
                                        <div className="review-card-top">
                                            <div className="review-avatar" aria-hidden="true">
                                                {getInitials(user?.name || user?.email || "Traveller")}
                                            </div>
                                            <div className="review-meta">
                                                <div className="review-name">My review</div>
                                                <div className="review-date">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="review-rating">
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <div className="review-pill-row">
                                            <span className="review-pill">Service: {review.serviceId}</span>
                                        </div>
                                        <p className="review-comment">{review.comment}</p>
                                        <div className="review-actions">
                                            <button
                                                type="button"
                                                className="review-danger-btn"
                                                onClick={() => handleDeleteReview(review.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* BOOKING MODAL */}
                {showBookingModal && (
                    <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Book Service</h2>
                            <form onSubmit={handleSubmitBooking}>
                                <div className="form-group">
                                    <label>Service:</label>
                                    <input type="text" value={selectedPost?.title} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Booking Date*:</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={bookingForm.bookingDate}
                                        onChange={(e) => setBookingForm({...bookingForm, bookingDate: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email*:</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={bookingForm.contactEmail}
                                        onChange={(e) => setBookingForm({...bookingForm, contactEmail: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone*:</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={bookingForm.contactPhone}
                                        onChange={(e) => setBookingForm({...bookingForm, contactPhone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message:</label>
                                    <textarea 
                                        rows="4"
                                        value={bookingForm.message}
                                        onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn">Submit Booking</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* REVIEW MODAL */}
                {showReviewModal && (
                    <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                        <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="review-modal-header">
                                <h2>Write a review</h2>
                                <p>Help others by sharing your experience.</p>
                            </div>
                            <form onSubmit={handleSubmitReview}>
                                <div className="form-group">
                                    <label>Service:</label>
                                    <input type="text" value={selectedPost?.title} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Rating*:</label>
                                    <div className="review-star-picker" role="radiogroup" aria-label="Select rating">
                                        {Array.from({ length: 5 }).map((_, idx) => {
                                            const starNumber = idx + 1;
                                            const active = reviewForm.rating >= starNumber;
                                            return (
                                                <button
                                                    key={starNumber}
                                                    type="button"
                                                    className={`review-star-btn ${active ? "active" : ""}`}
                                                    onClick={() =>
                                                        setReviewForm({
                                                            ...reviewForm,
                                                            rating: starNumber,
                                                        })
                                                    }
                                                    aria-label={`${starNumber} star${starNumber === 1 ? "" : "s"}`}
                                                >
                                                    ★
                                                </button>
                                            );
                                        })}
                                        <span className="review-rating-text">{reviewForm.rating} / 5</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Comment*:</label>
                                    <textarea 
                                        rows="5"
                                        required
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                        placeholder="Share your experience..."
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="review-primary-btn">Submit review</button>
                                    <button
                                        type="button"
                                        className="review-secondary-btn"
                                        onClick={() => setShowReviewModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}