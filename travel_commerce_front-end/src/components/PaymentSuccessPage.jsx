import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
// 🚨 FIX: Corrected the relative path for the CSS file
import '../styles/PaymentFlow.css'; 

export default function PaymentSuccessPage() {
    const nav = useNavigate();
    const location = useLocation();
    const { planName, postTitle, isNewPost } = location.state || {};

    // Redirect safeguard if state is missing
    useEffect(() => {
        if (!planName) {
            const timer = setTimeout(() => nav('/provider/dashboard'), 3000);
            return () => clearTimeout(timer);
        }
    }, [planName, nav]);

    return (
        <>
            <Navbar />
            <div className="payment-flow-container">
                <div className="payment-box success-box">
                    <h2 className="payment-title">🎉 Payment Successful!</h2>
                    
                    {isNewPost ? (
                        <p className="success-message">
                            Your new service, **"{postTitle}"**, has been **activated** with the **{planName}** plan. It is now live and visible to travellers!
                        </p>
                    ) : (
                        <p className="success-message">
                            Your payment has been successfully processed. Thank you for your continued partnership.
                        </p>
                    )}
                    
                    <div className="success-actions">
                        <Link to="/provider/dashboard" className="post-btn">
                            Go to Dashboard
                        </Link>
                        <Link to="/traveller/dashboard" className="close-btn">
                            View Live Listings
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}