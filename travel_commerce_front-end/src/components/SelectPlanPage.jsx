import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar'; 
import Footer from './Footer'; 
import '../styles/PaymentFlow.css'; 

// Define the available packages with their photo limits
const packages = [
    { id: 'standard', name: 'Standard Listing', price: 5, visibility: 'Default ranking in search results.', color: '#7B68EE', photoLimit: 5 }, // 🚨 ADDED photoLimit
    { id: 'featured', name: 'Featured Visibility', price: 15, visibility: 'Higher ranking and featured in district views.', color: '#6A5ACD', photoLimit: 10 }, // 🚨 ADDED photoLimit
    { id: 'premium', name: 'Premium Spotlight', price: 30, visibility: 'Top ranking, featured spotlight on dashboard, maximum exposure.', color: '#9370DB', recommended: true, photoLimit: 30 }, // 🚨 ADDED photoLimit
];

export default function SelectPlanPage() {
    const nav = useNavigate();
    const location = useLocation();
    const postData = location.state?.postData; // Get post data from ProviderDashboard

    if (!postData) {
        // Fallback if provider bypasses the post creation form
        return (
            <>
                <Navbar />
                <div className="payment-flow-container">
                    <div className="payment-error payment-box">
                        <p>⚠️ Error: Missing service details. Please start a new post.</p>
                        <Link to="/provider/dashboard" className="post-btn">Go to Dashboard</Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // 🚨 MODIFIED NAVIGATION: Now goes to the Photo Upload page
    const handleSelectPlan = (plan) => {
        // Navigate to the Photo Upload page, passing the post data AND selected plan
        nav('/post/add-photos', { // 🚨 NEW PATH
            state: { 
                postData: postData, 
                selectedPlan: plan 
            } 
        });
    };

    // 🚨 NEW FUNCTION: Back to Provider Dashboard
    const handleBackToDashboard = () => {
        nav('/provider/dashboard');
    };

    return (
        <>
            <Navbar />
            <div className="payment-flow-container">
                <div className="payment-box">
                    <h2 className="payment-title">Select Your Post Visibility Plan</h2>
                    <p className="payment-subtitle">Choose a package to determine your service's exposure on the Traveller Dashboard.</p>

                    <div className="plan-grid">
                        {packages.map((plan) => (
                            <div key={plan.id} className={`plan-card ${plan.recommended ? 'recommended' : ''}`}>
                                {plan.recommended && <div className="badge">Recommended</div>}
                                
                                <h3>{plan.name}</h3>
                                <div className="price-tag">
                                    <span className="price">${plan.price}</span> / per post
                                </div>
                                
                                <ul className="plan-features">
                                    {/* 🚨 ADDED PHOTO LIMIT FEATURE */}
                                    <li>🖼️ Maximum **{plan.photoLimit}** photos allowed</li> 
                                    <li>✅ One-time fee for this post</li>
                                    <li>✅ {plan.visibility}</li>
                                    <li>{plan.id === 'standard' ? '❌' : '✅'} Enhanced post tagging</li>
                                </ul>

                                <button 
                                    className="select-plan-btn" 
                                    style={{ backgroundColor: plan.color }}
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    Select Plan & Add Photos
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* 🚨 NEW BACK BUTTON */}
                    <button onClick={handleBackToDashboard} className="back-to-dashboard-btn">
                        ⬅️ Back to Dashboard
                    </button>

                </div>
            </div>
            <Footer />
        </>
    );
}