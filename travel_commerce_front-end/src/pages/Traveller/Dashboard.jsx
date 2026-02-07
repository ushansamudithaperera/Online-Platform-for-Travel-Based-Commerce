import React, { useState, useEffect } from "react"; 
import Navbar from "../../components/Navbar";
import "../../styles/TravellerDashboard.css";
import Footer from "../../components/Footer";
import { getAllServices, getServiceById } from "../../api/serviceApi"; 
import { getWishlist, getWishlistIds, toggleWishlist } from "../../api/wishlistApi";
import { aiSmartSearch } from "../../api/aiTripPlannerApi";
import TripPlanner from "../../components/TripPlanner";
import CategoryBookingForm from "../../components/CategoryBookingForm";
import BookingDetailsCard from "../../components/BookingDetailsCard";
import ReviewSection from "../../components/ReviewSection";
import { getBookingConfig, getCategoryKey } from "../../config/bookingCategoryConfig";
import { SRI_LANKA_DISTRICTS, normalizeDistrict } from "../../config/sriLankaDistricts";

// Category-specific price unit options (same as ServiceFormModal)
const PRICE_UNITS_BY_CATEGORY = {
  tour_guide: [
    { value: "per person", label: "Per Person" },
    { value: "per group", label: "Per Group" },
    { value: "per day", label: "Per Day" },
    { value: "per half day", label: "Per Half Day" },
    { value: "per hour", label: "Per Hour" },
  ],
  hotel: [
    { value: "per night", label: "Per Night" },
    { value: "per room per night", label: "Per Room / Night" },
  ],
  restaurant: [],
  experience: [
    { value: "per person", label: "Per Person" },
    { value: "per group", label: "Per Group" },
    { value: "per package", label: "Per Package" },
  ],
  driver: [
    { value: "per km", label: "Per Km" },
    { value: "per day", label: "Per Day" },
    { value: "per destination", label: "Per Destination" },
  ],
};
import { 
    createBooking, 
    getMyBookings, 
    cancelBooking, 
    hideBooking,
    createReview, 
    getServiceReviews,
    getMyReviews,
    deleteReview,
    updateReview,
    updateBookingStatus 
} from "../../api/travellerApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    FaUmbrellaBeach,
    FaCar,
    FaHotel,
    FaHiking,
    FaUtensils,
    FaGlobeAsia,
    FaWhatsapp,
} from "react-icons/fa";

const backendBaseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || "http://localhost:8080";

export default function TravellerDashboard() {
    const { user } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("services"); // services, favorites, tripPlanner, bookings, reviews
    
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [aiSearching, setAiSearching] = useState(false);
    const [aiFilteredIds, setAiFilteredIds] = useState(null);
    const [aiSearchMessage, setAiSearchMessage] = useState(""); // Feedback message for AI search
    const [useAiSearch, setUseAiSearch] = useState(true); // Toggle for AI search 
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [priceUnit, setPriceUnit] = useState("all");
    const [sortBy, setSortBy] = useState("recommended");
    const [selectedPost, setSelectedPost] = useState(null);
    const [viewingSinglePost, setViewingSinglePost] = useState(null); // Track if viewing from My Reviews
    const [cameFromTripPlanner, setCameFromTripPlanner] = useState(false); // Track navigation from Trip Planner
    const [loading, setLoading] = useState(true); 
    const [posts, setPosts] = useState([]);

    // Wishlist / Favorites
    const [wishlistIds, setWishlistIds] = useState([]); // array of serviceIds
    const [favoritePosts, setFavoritePosts] = useState([]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    // Booking states
    const [bookings, setBookings] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    
    // Review states
    const [reviews, setReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [serviceReviews, setServiceReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ""
    });
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewForm, setEditReviewForm] = useState({
        rating: 5,
        comment: ""
    }); 

    const categories = [
        { id: "tour_guide", name: "Tour Guides", icon: FaUmbrellaBeach },
        { id: "driver", name: "Drivers", icon: FaCar },
        { id: "hotel", name: "Hotels", icon: FaHotel },
        { id: "experience", name: "Experience", icon: FaHiking },
        { id: "restaurant", name: "Restaurants", icon: FaUtensils },
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

    const getSafeExternalUrl = (value) => {
        if (!value) return null;
        const text = String(value).trim();
        try {
            const url = new URL(text);
            if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
            return null;
        } catch {
            return null;
        }
    };

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
        if (activeTab === "tripPlanner") {
            // keep wishlist state fresh for heart indicators when navigating
            fetchWishlistIds();
        }
        if (activeTab === "bookings") fetchMyBookings();
        if (activeTab === "reviews") fetchMyReviews();

        // avoid carrying a selection across tabs (except when viewing from My Reviews)
        if (activeTab !== "services") {
            setSelectedPost(null);
            setViewingSinglePost(null);
        }
    }, [activeTab]); 

    // Clear viewingSinglePost when user manually changes filters or search
    useEffect(() => {
        if (viewingSinglePost && (searchTerm || selectedCategory !== "all" || selectedDistrict !== "all" || 
            priceMin || priceMax || priceUnit !== "all" || sortBy !== "recommended")) {
            // User is manually filtering, clear the single post view
            setViewingSinglePost(null);
        }
    }, [searchTerm, selectedCategory, selectedDistrict, priceMin, priceMax, priceUnit, sortBy]);

    useEffect(() => {
        if (selectedPost && (activeTab === "services" || activeTab === "favorites")) {
            fetchServiceReviews(selectedPost.id);
        }
    }, [selectedPost, activeTab]);

    const openServiceFromPlan = async (serviceId) => {
        if (!serviceId) return;
        try {
            setLoading(true);
            const res = await getServiceById(serviceId);
            setCameFromTripPlanner(true);
            setActiveTab("services");
            setSelectedPost(res?.data || null);
        } catch (error) {
            console.error("Failed to open service:", error);
        } finally {
            setLoading(false);
        }
    };

    const backToTripPlanner = () => {
        setSelectedPost(null);
        setCameFromTripPlanner(false);
        setActiveTab("tripPlanner");
    };

    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedPost?.id]);

    // Keep priceUnit compatible with the selected category
    useEffect(() => {
        if (selectedCategory === "all") {
            setPriceUnit("all");
            return;
        }

        const key = getCategoryKey(selectedCategory);
        const units = PRICE_UNITS_BY_CATEGORY[key] || [];

        if (!units.length) {
            setPriceUnit("all");
            return;
        }

        if (priceUnit === "all") return;
        const stillValid = units.some((u) => String(u.value) === String(priceUnit));
        if (!stillValid) setPriceUnit("all");
    }, [selectedCategory]);

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
        // Check if the service has an external booking URL
        if (selectedPost?.externalBookingUrl) {
            // Redirect to external booking site
            window.open(selectedPost.externalBookingUrl, '_blank', 'noopener,noreferrer');
            toast.info("Redirecting to provider's booking site...");
        } else {
            // Show internal booking modal
            setShowBookingModal(true);
        }
    };

    const buildWhatsappUrl = (rawNumber) => {
        const raw = String(rawNumber || "").trim();
        if (!raw) return null;

        // Keep digits only for wa.me
        let digits = raw.replace(/\D/g, "");
        if (!digits) return null;

        // Support international 00 prefix
        if (digits.startsWith("00")) {
            digits = digits.slice(2);
        }

        // Sri Lanka-friendly normalization
        if (digits.length === 10 && digits.startsWith("0")) {
            digits = "94" + digits.slice(1);
        }

        // Basic length sanity
        if (digits.length < 8 || digits.length > 15) return null;
        return `https://wa.me/${digits}`;
    };

    const handleWhatsappChat = () => {
        const url = buildWhatsappUrl(selectedPost?.whatsappNumber);
        if (!url) {
            toast.error("WhatsApp number is missing or invalid");
            return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleSubmitBooking = async (bookingData) => {
        setIsSubmittingBooking(true);
        try {
            await createBooking(bookingData);
            toast.success("Booking created successfully!");
            setShowBookingModal(false);
            fetchMyBookings();
        } catch (error) {
            console.error("Booking failed:", error);
            toast.error("Failed to create booking");
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const handleCancelBooking = async (booking) => {
        if (!booking) return;
        if (String(booking.status).toUpperCase() !== "PENDING") {
            toast.error("Only pending bookings can be cancelled");
            return;
        }

        const confirmed = await toast.confirm({
            title: "Cancel Booking",
            message: "Are you sure you want to cancel this booking?",
            type: "warning",
            confirmText: "Yes, Cancel",
        });
        if (!confirmed) return;

        try {
            await cancelBooking(booking.id);
            toast.success("Booking cancelled");
            fetchMyBookings();
        } catch (error) {
            console.error("Cancel failed:", error);
            toast.error("Failed to cancel booking");
        }
    };

    const handleRemoveFromMyBookings = async (booking) => {
        if (!booking) return;
        const status = String(booking.status).toUpperCase();
        if (!(status === "CANCELLED" || status === "COMPLETED")) {
            toast.error("You can remove only cancelled or completed bookings");
            return;
        }

        const confirmed = await toast.confirm({
            title: "Remove Booking",
            message: "Remove this booking from My Bookings?",
            type: "warning",
            confirmText: "Remove",
        });
        if (!confirmed) return;

        try {
            await hideBooking(booking.id);
            toast.success("Removed from My Bookings");
            fetchMyBookings();
        } catch (error) {
            console.error("Remove failed:", error);
            toast.error("Failed to remove booking");
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            await createReview({
                serviceId: selectedPost.id,
                ...reviewForm
            });
            toast.success("Review submitted successfully!");
            setShowReviewModal(false);
            setReviewForm({ rating: 5, comment: "" });
            fetchServiceReviews(selectedPost.id);
        } catch (error) {
            console.error("Review submission failed:", error);
            toast.error("Failed to submit review");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = await toast.confirm({
            title: "Delete Review",
            message: "Are you sure you want to delete this review?",
            type: "danger",
            confirmText: "Delete",
        });
        if (confirmed) {
            try {
                await deleteReview(reviewId);
                toast.success("Review deleted");
                fetchMyReviews();
            } catch (error) {
                console.error("Delete failed:", error);
                toast.error("Failed to delete review");
            }
        }
    };

    const handleStartEditReview = (review) => {
        setEditingReviewId(review.id);
        setEditReviewForm({
            rating: review.rating,
            comment: review.comment
        });
    };

    const handleCancelEditReview = () => {
        setEditingReviewId(null);
        setEditReviewForm({ rating: 5, comment: "" });
    };

    const handleUpdateReview = async (e, reviewId) => {
        e.preventDefault();
        try {
            await updateReview(reviewId, editReviewForm);
            toast.success("Review updated successfully!");
            setEditingReviewId(null);
            fetchMyReviews();
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update review");
        }
    };

    const handleViewServicePost = async (serviceId) => {
        try {
            // Fetch the service details
            const response = await getServiceById(serviceId);
            const service = response.data;
            
            // Clear all filters and search
            setSearch("");
            setSearchTerm("");
            setAiFilteredIds(null);
            setAiSearchMessage("");
            setSelectedCategory("all");
            setSelectedDistrict("all");
            setPriceMin("");
            setPriceMax("");
            setPriceUnit("all");
            
            // Set viewing single post mode
            setViewingSinglePost(serviceId);
            
            // Switch to services tab and select the post
            setActiveTab("services");
            setSelectedPost(service);
            
            // Fetch reviews for the service
            fetchServiceReviews(serviceId);
        } catch (error) {
            console.error("Failed to load service:", error);
            toast.error("Failed to load service post");
        }
    };

    const handleSearch = async () => {
        const trimmed = String(searchTerm || "").trim();
        if (!trimmed) {
            setSearch("");
            setAiFilteredIds(null);
            return;
        }

        // Try AI-powered search first if enabled
        if (useAiSearch) {
            setAiSearching(true);
            setAiSearchMessage("");
            try {
                // Prepare simplified post data for AI
                const simplifiedPosts = posts.map(p => ({
                    id: Number(p.id) || p.id, // Ensure numeric ID for backend
                    title: p.title,
                    description: toPlainText(p.description),
                    category: p.category,
                    district: p.district,
                    location: p.location,
                    price: p.price,
                    priceUnit: p.priceUnit
                }));

                console.log('=== AI SEARCH DEBUG ===');
                console.log('Search query:', trimmed);
                console.log('Total posts:', simplifiedPosts.length);
                console.log('Sample post categories:', simplifiedPosts.slice(0, 3).map(p => ({ id: p.id, cat: p.category, dist: p.district })));
                
                const response = await aiSmartSearch({
                    searchQuery: trimmed,
                    availablePosts: simplifiedPosts
                });

                console.log('AI search response:', response?.data);

                const matchedIds = response?.data?.matchedPostIds || [];
                console.log('Matched IDs count:', matchedIds.length);
                console.log('Matched IDs:', matchedIds);
                console.log('Matched IDs types:', matchedIds.slice(0, 3).map(id => ({ id, type: typeof id })));
                console.log('Sample post IDs:', posts.slice(0, 3).map(p => ({ id: p.id, type: typeof p.id })));
                
                if (Array.isArray(matchedIds) && matchedIds.length > 0) {
                    // Ensure ID types match - convert to strings for comparison if needed
                    const idsAsStrings = matchedIds.map(id => String(id));
                    setAiFilteredIds(new Set(idsAsStrings));
                    setSearch(""); // Clear keyword search when using AI
                    setAiSearchMessage("");
                    console.log('AI search SET with', idsAsStrings.length, 'results');
                } else {
                    console.log('No AI results, falling back to keyword search');
                    // No AI results - fall back to keyword search silently
                    setSearch(trimmed.toLowerCase());
                    setAiFilteredIds(null);
                    setAiSearchMessage("");
                }
            } catch (error) {
                console.error("AI search failed:", error);
                console.error("Error details:", error.response?.data || error.message);
                // On error, fall back to keyword search silently
                setSearch(trimmed.toLowerCase());
                setAiFilteredIds(null);
                setAiSearchMessage("");
            } finally {
                setAiSearching(false);
            }
        } else {
            // Use traditional keyword search
            setSearch(trimmed.toLowerCase());
            setAiFilteredIds(null);
        }
    };

    const handleToggleSearchMode = () => {
        setUseAiSearch(!useAiSearch);
        // Clear search results when switching modes
        setSearch("");
        setAiFilteredIds(null);
        setSearchTerm("");
        setAiSearchMessage("");
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setSearch("");
        setAiFilteredIds(null);
        setAiSearchMessage("");
        setSelectedCategory("all");
        setSelectedDistrict("all");
        setPriceMin("");
        setPriceMax("");
        setPriceUnit("all");
        setSortBy("recommended");
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

    const parseMoney = (value) => {
        if (value === null || value === undefined) return null;
        const text = String(value).trim();
        if (text === "") return null;
        const n = Number(text);
        return Number.isFinite(n) ? n : null;
    };

    const matchesPriceRange = (post, minValue, maxValue) => {
        const from = parseMoney(post?.priceFrom);
        const to = parseMoney(post?.priceTo);

        // If the service has no price info, keep it unless user actively filters by price.
        if (from === null && to === null) {
            return minValue === null && maxValue === null;
        }

        const serviceMin = from !== null ? from : to;
        const serviceMax = to !== null ? to : from;

        if (minValue !== null && serviceMax !== null && serviceMax < minValue) return false;
        if (maxValue !== null && serviceMin !== null && serviceMin > maxValue) return false;
        return true;
    };

    // If AI isn't used, fall back to live keyword input so users see instant filtering
    const query = String(search || (!useAiSearch ? searchTerm : "")).trim().toLowerCase();

    // Common stop words to ignore during keyword search
    const STOP_WORDS = new Set([
        "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
        "a", "an", "the", "this", "that", "these", "those",
        "is", "am", "are", "was", "were", "be", "been", "being",
        "do", "does", "did", "have", "has", "had", "having",
        "will", "would", "shall", "should", "can", "could", "may", "might",
        "to", "of", "in", "on", "at", "by", "for", "with", "from", "up", "about",
        "into", "through", "during", "before", "after", "above", "below", "between",
        "and", "but", "or", "nor", "not", "no", "so", "if", "then", "than",
        "go", "going", "went", "gone", "get", "got", "need", "want", "like",
        "just", "also", "very", "really", "much", "more", "most", "some", "any",
        "all", "both", "each", "every", "other", "such", "only",
        "there", "here", "where", "when", "how", "what", "which", "who", "whom",
        "its", "his", "her", "their", "ours", "yours", "him", "them", "us",
        "has", "had", "let", "make", "made", "see", "look", "find",
    ]);

    // Split query into meaningful keywords: remove stop words and very short words
    const searchKeywords = query
        ? query
              .split(/\s+/)
              .map((kw) => kw.replace(/[^a-z0-9]/g, "")) // strip punctuation
              .filter((kw) => kw.length >= 2 && !STOP_WORDS.has(kw))
          : [];

    const minBudget = parseMoney(priceMin);
    const maxBudget = parseMoney(priceMax);

    // Build haystack once per post for search matching
    const buildHaystack = (p) =>
        [p?.title, toPlainText(p?.description), p?.district, p?.location, p?.category]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

    // Filtering Logic - AI-powered semantic search OR keyword search
    const filteredPosts = posts
        .filter((p) => {
            // If AI search is active, filter by matched IDs only
            if (aiFilteredIds) {
                const matched = aiFilteredIds.has(String(p.id));
                if (!matched) {
                    console.log('Post filtered out by AI:', p.id, p.title?.substring(0, 30));
                }
                return matched;
            }
            // Keyword search: show all if no keywords, otherwise match ANY keyword (OR logic)
            if (searchKeywords.length === 0) return true;
            const haystack = buildHaystack(p);
            return searchKeywords.some((kw) => haystack.includes(kw));
        })
        .filter((p) => {
            if (selectedCategory === "all") return true;
            return getCategoryKey(p?.category) === getCategoryKey(selectedCategory);
        })
        .filter((p) =>
            selectedDistrict === "all"
                ? true
                : normalizeDistrict(p?.district) === normalizeDistrict(selectedDistrict)
        )
        .filter((p) => matchesPriceRange(p, minBudget, maxBudget))
        .filter((p) => {
            if (priceUnit === "all") return true;
            return String(p?.priceUnit || "").toLowerCase() === String(priceUnit || "").toLowerCase();
        });

    // Helper: count how many search keywords match a post (for relevance ranking)
    const getKeywordMatchCount = (post) => {
        if (searchKeywords.length === 0) return 0;
        const haystack = buildHaystack(post);
        return searchKeywords.filter((kw) => haystack.includes(kw)).length;
    };

    const sortedFilteredPosts = [...filteredPosts].sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
        }
        if (sortBy === "rating") {
            const ar = Number(a?.averageRating ?? a?.rating ?? 0);
            const br = Number(b?.averageRating ?? b?.rating ?? 0);
            return br - ar;
        }
        if (sortBy === "priceLow") {
            const aMin = parseMoney(a?.priceFrom) ?? parseMoney(a?.priceTo) ?? Number.POSITIVE_INFINITY;
            const bMin = parseMoney(b?.priceFrom) ?? parseMoney(b?.priceTo) ?? Number.POSITIVE_INFINITY;
            return aMin - bMin;
        }
        if (sortBy === "priceHigh") {
            const aMax = parseMoney(a?.priceTo) ?? parseMoney(a?.priceFrom) ?? Number.NEGATIVE_INFINITY;
            const bMax = parseMoney(b?.priceTo) ?? parseMoney(b?.priceFrom) ?? Number.NEGATIVE_INFINITY;
            return bMax - aMax;
        }
        // Default "recommended": if there's an active keyword search, sort by relevance
        if (searchKeywords.length > 0) {
            return getKeywordMatchCount(b) - getKeywordMatchCount(a);
        }
        return 0; // recommended (keep server order)
    });

    const visiblePosts = activeTab === "favorites" ? favoritePosts : 
                         viewingSinglePost ? sortedFilteredPosts.filter(p => (p.id || p._id) === viewingSinglePost) :
                         sortedFilteredPosts;

    // Hybrid layout: list view when searching/filtering and no selection
    const isAnyFilterActive =
        String(search || "").trim() !== "" ||
        selectedCategory !== "all" ||
        selectedDistrict !== "all" ||
        String(priceMin).trim() !== "" ||
        String(priceMax).trim() !== "" ||
        priceUnit !== "all" ||
        sortBy !== "recommended";

    const isListView = activeTab === "services" && !selectedPost && isAnyFilterActive;

    const bookingHintConfig = selectedCategory !== "all" ? getBookingConfig(selectedCategory) : null;
    const bookingRequiredLabels = bookingHintConfig
        ? bookingHintConfig.fields.filter((f) => f.required).map((f) => f.label)
        : [];

    const districtsFromPosts = Array.from(
        new Set((Array.isArray(posts) ? posts : []).map((p) => String(p?.district || "").trim()).filter(Boolean))
    );
    const knownDistrictsLower = new Set(SRI_LANKA_DISTRICTS.map((d) => normalizeDistrict(d)));
    const extraDistricts = districtsFromPosts
        .filter((d) => !knownDistrictsLower.has(normalizeDistrict(d)))
        .sort((a, b) => a.localeCompare(b));
    const availableDistricts = [...SRI_LANKA_DISTRICTS, ...extraDistricts];

    // Get price unit options for currently selected category
    const categoryKey = selectedCategory === "all" ? null : getCategoryKey(selectedCategory);
    const availablePriceUnits = categoryKey ? (PRICE_UNITS_BY_CATEGORY[categoryKey] || []) : [];

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
                        className={`tab-btn ${activeTab === "tripPlanner" ? "active" : ""}`}
                        onClick={() => setActiveTab("tripPlanner")}
                    >
                        Trip Planner
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
                                {/* SEARCH BAR - SEPARATE SECTION */}
                                <div className="traveller-search-section">
                                    <div className="search-controls-wrapper">
                                        <div className="search-input-wrapper">
                                            <input
                                                className="search-input"
                                                type="text"
                                                placeholder={useAiSearch 
                                                    ? "Try: 'beachside hotels', 'romantic dinner spots', 'adventure activities'..." 
                                                    : "Search by title, district, location, category..."
                                                }
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleSearch();
                                                    }
                                                }}
                                            />
                                            <button 
                                                className="search-icon-btn" 
                                                onClick={handleSearch}
                                                disabled={aiSearching}
                                            >
                                                {aiSearching ? "🤖 Searching..." : (useAiSearch ? "🤖 AI Search" : "🔍 Search")}
                                            </button>
                                        </div>
                                        <button 
                                            className="ai-toggle-btn"
                                            onClick={handleToggleSearchMode}
                                            title={useAiSearch ? "Switch to keyword search" : "Switch to AI search"}
                                        >
                                            {useAiSearch ? "⚡ AI" : "📝 Keywords"}
                                        </button>
                                    </div>
                                    {aiFilteredIds && (
                                        <div className="search-mode-badge">
                                            🤖 AI-powered results ({aiFilteredIds.size} matches)
                                        </div>
                                    )}
                                    {!aiFilteredIds && search && useAiSearch && (
                                        <div className="search-mode-badge">
                                            🔍 Showing keyword results for "{searchTerm}"
                                        </div>
                                    )}
                                    {!useAiSearch && searchTerm && (
                                        <div className="search-mode-badge">
                                            📝 Keyword search active
                                        </div>
                                    )}
                                </div>

                                {/* FILTERS */}
                                <div className="traveller-filters">
                                    <div className="traveller-filters-row">
                                        <div className="filter-card filter-card-wide">
                                            <div className="filter-card-label">District</div>
                                            <select
                                                className="filter-select"
                                                value={selectedDistrict}
                                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                            >
                                                <option value="all">All Districts</option>
                                                {availableDistricts.map((d) => (
                                                    <option key={d} value={d}>
                                                        {d}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {availablePriceUnits.length > 0 && (
                                            <div className="filter-card filter-card-wide">
                                                <div className="filter-card-label">Price Unit</div>
                                                <select
                                                    className="filter-select"
                                                    value={priceUnit}
                                                    onChange={(e) => setPriceUnit(e.target.value)}
                                                >
                                                    <option value="all">All Units</option>
                                                    {availablePriceUnits.map((unit) => (
                                                        <option key={unit.value} value={unit.value}>
                                                            {unit.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="filter-card filter-card-wide">
                                            <div className="filter-card-label">Sort</div>
                                            <select
                                                className="filter-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="recommended">Recommended</option>
                                                <option value="newest">Newest</option>
                                                <option value="rating">Top rated</option>
                                                <option value="priceLow">Price: Low → High</option>
                                                <option value="priceHigh">Price: High → Low</option>
                                            </select>
                                        </div>

                                        <div className="filter-card filter-card-price">
                                            <div className="filter-card-label">Budget (LKR)</div>
                                            <div className="budget-inputs">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    className="budget-input"
                                                    placeholder="Min"
                                                    value={priceMin}
                                                    onChange={(e) => setPriceMin(e.target.value)}
                                                />
                                                <span className="budget-sep">–</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    className="budget-input"
                                                    placeholder="Max"
                                                    value={priceMax}
                                                    onChange={(e) => setPriceMax(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="filters-reset-btn"
                                            onClick={handleResetFilters}
                                            disabled={!isAnyFilterActive}
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    {bookingRequiredLabels.length > 0 && (
                                        <div className="booking-hint-bar" role="note">
                                            <div className="booking-hint-title">Booking required:</div>
                                            <div className="booking-hint-chips">
                                                {bookingRequiredLabels.map((label) => (
                                                    <span key={label} className="booking-hint-chip">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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

                        {/* MAIN CONTENT: POSTS LIST + OPTIONAL SELECTED POST (SPLIT VIEW) */}
                        <div className={`main-content ${selectedPost ? "show-two-column" : "single-column"}`}>
                            <div className={`posts-section ${selectedPost ? "shrunk" : ""} ${isListView ? "list-view" : ""}`}>
                                {loading ? (
                                    <p style={{ padding: '20px' }}>Loading services...</p>
                                ) : visiblePosts.length === 0 ? (
                                    <div className="no-results-error">
                                        <div className="no-results-icon">{activeTab === "favorites" ? "💔" : "🔍"}</div>
                                        <h3 className="no-results-title">
                                            {activeTab === "favorites" ? "No favorites yet" : "No services found"}
                                        </h3>
                                        <p className="no-results-subtitle">
                                            {activeTab === "favorites"
                                                ? "Start exploring and save services you love!"
                                                : "Try adjusting your search or filters to find what you're looking for."}
                                        </p>
                                    </div>
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

                                                    {/* PRICE DISPLAY - PROMINENT */}
                                                    {p.priceFrom || p.priceTo ? (
                                                        <div className="post-card-price-banner">
                                                            <span className="price-currency">{p.currency || "LKR"}</span>
                                                            <div className="price-amount-display">
                                                                {p.priceFrom && <span className="price-value">{Number(p.priceFrom).toLocaleString()}</span>}
                                                                {p.priceFrom && p.priceTo && <span className="price-separator">–</span>}
                                                                {p.priceTo && <span className="price-value">{Number(p.priceTo).toLocaleString()}</span>}
                                                            </div>
                                                            {p.priceUnit && <span className="price-unit">{p.priceUnit}</span>}
                                                        </div>
                                                    ) : null}

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
                            {selectedPost && (
                                <div className="selected-post">
{cameFromTripPlanner && (
                        <button
                            type="button"
                            className="back-to-planner-btn"
                            onClick={backToTripPlanner}
                        >
                            ← Back to Trip Planner
                        </button>
                    )}
                    <button
                        type="button"
                        className="close-btn"
                        onClick={() => {
                            if (cameFromTripPlanner) {
                                backToTripPlanner();
                            } else {
                                setSelectedPost(null);
                                setViewingSinglePost(null);
                                setActiveImageIndex(0);
                            }
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
                                                                onClick={goToPrevImage}
                                                            >
                                                                ‹
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="traveller-gallery-nav next"
                                                                onClick={goToNextImage}
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

                                    {(selectedPost.priceFrom || selectedPost.priceTo) && (
                                        <div className="traveller-inline-price">
                                            <strong>💰 Price:</strong>{" "}
                                            <span className="traveller-price-amount">
                                                {selectedPost.currency || "LKR"}{" "}
                                                {selectedPost.priceFrom
                                                    ? Number(selectedPost.priceFrom).toLocaleString()
                                                    : ""}
                                                {selectedPost.priceFrom && selectedPost.priceTo && " – "}
                                                {selectedPost.priceTo
                                                    ? Number(selectedPost.priceTo).toLocaleString()
                                                    : ""}
                                            </span>
                                            {selectedPost.priceUnit && (
                                                <span className="traveller-price-unit"> {selectedPost.priceUnit}</span>
                                            )}
                                        </div>
                                    )}

                                    <div dangerouslySetInnerHTML={{ __html: selectedPost.description }} />
                                    <p><strong>District:</strong> {selectedPost.district}</p>
                                    <p>
                                        <strong>Location:</strong>{" "}
                                        {(() => {
                                            const safeUrl = getSafeExternalUrl(selectedPost.location);
                                            if (!safeUrl) return <span>{selectedPost.location || "—"}</span>;
                                            return (
                                                <a
                                                    href={safeUrl}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                >
                                                    {safeUrl}
                                                </a>
                                            );
                                        })()}
                                    </p>

                                    {selectedPost.externalBookingUrl && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#e3f2fd',
                                            borderLeft: '4px solid #2196f3',
                                            borderRadius: '4px',
                                            marginBottom: '16px'
                                        }}>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#1565c0' }}>
                                                <strong>ℹ️ Provider Info:</strong> This service uses the provider's own booking system.
                                                You'll be redirected to their website to complete your booking.
                                            </p>
                                        </div>
                                    )}

                                    <div className="book-actions">
                                        {buildWhatsappUrl(selectedPost?.whatsappNumber) && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary whatsapp-btn"
                                                onClick={handleWhatsappChat}
                                            >
                                                <FaWhatsapp aria-hidden="true" focusable="false" />
                                                WhatsApp Chat
                                            </button>
                                        )}
                                        <button type="button" className="btn book-btn" onClick={handleBookService}>
                                            {selectedPost.externalBookingUrl
                                                ? "🌐 Visit Provider's Booking Site"
                                                : "📅 Book This Service"}
                                        </button>
                                    </div>

                                    <button
                                        className="btn write-review-btn"
                                        onClick={() => setShowReviewModal(true)}
                                        style={{
                                            marginTop: '16px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        ✍️ Write a Review
                                    </button>

                                    <ReviewSection
                                        reviews={serviceReviews}
                                        serviceId={selectedPost.id}
                                        onReviewsUpdate={fetchServiceReviews}
                                        currentUserId={user?.id}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* TRIP PLANNER TAB — kept mounted so state persists */}
                <div style={{ display: activeTab === "tripPlanner" ? "block" : "none" }}>
                    <TripPlanner onOpenService={openServiceFromPlan} />
                </div>

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
                                    <div key={booking.id} className="booking-item">
                                        <BookingDetailsCard
                                            booking={booking}
                                            isProvider={false}
                                            onStatusChange={async () => {
                                                // Traveler can't change status, but keep for compatibility
                                                fetchMyBookings();
                                            }}
                                            onCancelBooking={() => handleCancelBooking(booking)}
                                            onViewPost={openServiceFromPlan}
                                            onRemoveBooking={() => handleRemoveFromMyBookings(booking)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === "reviews" && (
                    <div className="my-reviews-section">
                        <h2>My Reviews</h2>
                        {loading ? (
                            <p>Loading reviews...</p>
                        ) : myReviews.length === 0 ? (
                            <p className="no-results-error">No reviews yet.</p>
                        ) : (
                            <div className="my-reviews-list">
                                {myReviews.map((review) => (
                                    <div key={review.id} className="my-review-card-compact">
                                        {editingReviewId === review.id ? (
                                            <form className="review-edit-form-compact" onSubmit={(e) => handleUpdateReview(e, review.id)}>
                                                <div className="edit-header">
                                                    <h4>Edit Review</h4>
                                                </div>
                                                <div className="edit-rating-row">
                                                    <label>Rating:</label>
                                                    <select 
                                                        value={editReviewForm.rating} 
                                                        onChange={(e) => setEditReviewForm({ ...editReviewForm, rating: Number(e.target.value) })}
                                                        className="edit-rating-select"
                                                    >
                                                        <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                                                        <option value={4}>⭐⭐⭐⭐ Good</option>
                                                        <option value={3}>⭐⭐⭐ Average</option>
                                                        <option value={2}>⭐⭐ Poor</option>
                                                        <option value={1}>⭐ Terrible</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    className="edit-comment-input"
                                                    value={editReviewForm.comment}
                                                    onChange={(e) => setEditReviewForm({ ...editReviewForm, comment: e.target.value })}
                                                    placeholder="Write your review..."
                                                    rows={3}
                                                    required
                                                />
                                                <div className="edit-actions">
                                                    <button type="button" className="btn-cancel-compact" onClick={handleCancelEditReview}>
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="btn-save-compact">
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="review-compact-header">
                                                    <div className="review-stars-compact">
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <div className="review-date-compact">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <p className="review-comment-compact">{review.comment}</p>
                                                <div className="review-compact-actions">
                                                    <button
                                                        className="btn-view-post-compact"
                                                        onClick={() => handleViewServicePost(review.serviceId)}
                                                        title="View Service Post"
                                                    >
                                                        📌 View Post
                                                    </button>
                                                    <div className="review-action-icons">
                                                        <button
                                                            className="icon-btn-compact edit-icon"
                                                            onClick={() => handleStartEditReview(review)}
                                                            title="Edit review"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="icon-btn-compact delete-icon"
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            title="Delete review"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* BOOKING MODAL */}
                {showBookingModal && selectedPost && (
                    <div className="modal-overlay booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
                        <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
                            <CategoryBookingForm
                                serviceId={selectedPost.id || selectedPost._id}
                                category={selectedPost.category}
                                serviceData={selectedPost}
                                onSubmit={handleSubmitBooking}
                                onCancel={() => setShowBookingModal(false)}
                                isLoading={isSubmittingBooking}
                            />
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