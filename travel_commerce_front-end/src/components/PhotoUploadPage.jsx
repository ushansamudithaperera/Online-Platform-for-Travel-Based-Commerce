import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 
import '../styles/PaymentFlow.css'; // Reusing payment styles

export default function PhotoUploadPage() {
    const nav = useNavigate();
    const location = useLocation();
    const { postData, selectedPlan } = location.state || {}; // Get post data AND plan

    // State to store uploaded files (File objects)
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [error, setError] = useState('');

    if (!selectedPlan || !postData) {
        return (
            <>
                <Navbar />
                <div className="payment-flow-container">
                    <div className="payment-error payment-box">
                        <p>⚠️ Error: Missing plan or service details. Please start over.</p>
                        <Link to="/provider/dashboard" className="post-btn">Go to Dashboard</Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }
    
    // The maximum photo limit for the selected plan
    const MAX_PHOTOS = selectedPlan.photoLimit;

    const handleFileChange = (e) => {
        setError('');
        const files = Array.from(e.target.files);
        
        // Combine existing files and new files
        const newTotal = uploadedFiles.length + files.length;
        
        if (newTotal > MAX_PHOTOS) {
            setError(`You can only upload a maximum of ${MAX_PHOTOS} photos for the ${selectedPlan.name} plan. Please select fewer files.`);
            // Reset the input field value to allow selecting files again
            e.target.value = null; 
            return;
        }

        setUploadedFiles(prev => [...prev, ...files]);
        // Reset input value to allow the same file to be selected again after error
        e.target.value = null; 
    };

    const handleRemoveFile = (indexToRemove) => {
        setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleProceedToPayment = () => {
        if (uploadedFiles.length === 0) {
            setError('Please upload at least one photo for your service.');
            return;
        }
        
        // 🚨 IMPORTANT: In a real app, you would upload the files to a server 
        // (e.g., AWS S3, Cloudinary) here, and the server would return image URLs.
        // For this mock flow, we just pass the file *count* and proceed.
        
        const finalPostData = {
            ...postData,
            imageCount: uploadedFiles.length,
            // In a real app: imageURLs: ['url1', 'url2', ...]
        };

        // Navigate to the final Checkout Page
        nav('/payment/checkout', { 
            state: { 
                postData: finalPostData, 
                selectedPlan: selectedPlan 
            } 
        });
    };

    return (
        <>
            <Navbar />
            <div className="payment-flow-container">
                <div className="payment-box checkout-box">
                    <h2 className="payment-title">Upload Service Photos</h2>
                    <p className="payment-subtitle">
                        Selected Plan: **{selectedPlan.name}** | Limit: **{MAX_PHOTOS}** photos
                    </p>

                    <div className="upload-section">
                        <label className="custom-file-upload">
                            Choose Photos (Max {MAX_PHOTOS})
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>
                        
                        {error && <p className="error-msg upload-error-msg">⚠️ {error}</p>}

                        <div className="file-list">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                                    <button 
                                        type="button" 
                                        className="remove-file-btn"
                                        onClick={() => handleRemoveFile(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="upload-summary">
                            **{uploadedFiles.length}** of {MAX_PHOTOS} photos uploaded.
                        </p>
                    </div>


                    <button 
                        type="button" 
                        className="post-btn"
                        onClick={handleProceedToPayment}
                        style={{ marginTop: '20px' }}
                    >
                        Proceed to Payment (${selectedPlan.price})
                    </button>

                    {/* Back button to re-select plan */}
                    <button 
                        onClick={() => nav(-1)} // Go back to the previous page (SelectPlanPage)
                        className="back-to-dashboard-btn"
                    >
                        ⬅️ Change Plan
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}