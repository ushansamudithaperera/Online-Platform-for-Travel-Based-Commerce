import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar'; // Corrected path (from previous fix)
import Footer from './Footer'; // Corrected path (from previous fix)
// 🚨 FIX: Corrected CSS import path
import '../styles/PaymentFlow.css'; 

export default function CheckoutPage() {
    const nav = useNavigate();
    const location = useLocation();
    const { postData, selectedPlan } = location.state || {};

    const [cardDetails, setCardDetails] = useState({
        number: '4242424242424242', // Mock card for easy testing
        expiry: '12/26',
        cvc: '123',
        name: 'John Doe'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!selectedPlan || !postData) {
        return (
            <div className="payment-error">
                <p>⚠️ Error: Missing plan or service details. Please start over.</p>
            </div>
        );
    }

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // --- MOCK PAYMENT PROCESSING ---
        setTimeout(() => {
            setLoading(false);
            
            // Simulate a successful payment
            const isSuccess = cardDetails.number.startsWith('4242');
            
            if (isSuccess) {
                nav('/payment/success', { 
                    state: { 
                        planName: selectedPlan.name, 
                        postTitle: postData.description.substring(0, 30) + '...', // Use description for title since title is missing here
                        isNewPost: true
                    } 
                });
            } else {
                setError('Payment failed. Please check your card details.');
            }
        }, 2000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <Navbar />
            <div className="payment-flow-container">
                <div className="payment-box checkout-box">
                    <h2 className="payment-title">Complete Payment</h2>
                    {/* Note: postData.title is missing, using description for temporary display */}
                    <p className="payment-subtitle">Post: **{postData.description.substring(0, 30)}...** | Plan: **{selectedPlan.name}** | Amount: **${selectedPlan.price}**</p>
                    
                    <form onSubmit={handlePaymentSubmit} className="checkout-form">
                        
                        <label>Card Number</label>
                        <input type="text" name="number" value={cardDetails.number} onChange={handleChange} required maxLength="16" placeholder="XXXX XXXX XXXX XXXX" />

                        <label>Name on Card</label>
                        <input type="text" name="name" value={cardDetails.name} onChange={handleChange} required placeholder="Full Name" />

                        <div className="expiry-group">
                            <div>
                                <label>Expiry (MM/YY)</label>
                                <input type="text" name="expiry" value={cardDetails.expiry} onChange={handleChange} required maxLength="5" placeholder="MM/YY" />
                            </div>
                            <div>
                                <label>CVC</label>
                                <input type="text" name="cvc" value={cardDetails.cvc} onChange={handleChange} required maxLength="4" placeholder="CVC" />
                            </div>
                        </div>

                        {error && <p className="error-msg">{error}</p>}
                        
                        <button type="submit" className="post-btn" disabled={loading}>
                            {loading ? `Processing $${selectedPlan.price}...` : `Pay $${selectedPlan.price} and Post`}
                        </button>

                        <p className="mock-note">
                            *This is a mock checkout. Use any details; payment will succeed if card starts with 4242.
                        </p>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}