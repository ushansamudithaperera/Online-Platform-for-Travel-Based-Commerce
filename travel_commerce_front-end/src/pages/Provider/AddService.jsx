import { useState } from "react";
import axios from "../../api/axiosConfig"; 
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AddService() {
    const { user } = useAuth();
    const navigate = useNavigate();
   
    

    
    const TITLE_MAX_LENGTH =25; // add near top of component
    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        district: "",
        location: "",
        category: "Hotel", // Default
        price: ""
    });
    
    const [imageFile, setImageFile] = useState(null); // Store the selected file
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handle Text Inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle File Selection
    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]); // Get the first file selected
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create a FormData object (Required for sending files)
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("district", formData.district);
            data.append("location", formData.location);
            data.append("category", formData.category);
            data.append("price", formData.price);
            
            // 2. Append the file if it exists
            if (imageFile) {
                data.append("image", imageFile);
            }

            // 3. Send to Backend
            // Note: Axios automatically sets 'Content-Type': 'multipart/form-data' when sending FormData
            await axios.post("/services", data);
            
            alert("Service Created Successfully!");
            navigate("/provider/dashboard"); // Redirect back to dashboard

        } catch (err) {
            console.error(err);
            setError("Failed to create service. Ensure you are logged in as a Provider.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "600px" }}>
            <h2 className="mb-4">Add New Service</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Title */}
                <div className="mb-3">
                    <label className="form-label">Service Title</label>
                    <input type="text" name="title" className="form-control" required onChange={handleChange} />
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" rows="3" required onChange={handleChange}></textarea>
                </div>

                {/* Category */}
                <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select name="category" className="form-select" onChange={handleChange}>
                        <option value="Hotel">Hotel</option>
                        <option value="Driver">Driver</option>
                        <option value="Guide">Guide</option>
                    </select>
                </div>

                {/* Location & District */}
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label">District</label>
                        <input type="text" name="district" className="form-control" required onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Exact Location</label>
                        <input type="text" name="location" className="form-control" required onChange={handleChange} />
                    </div>
                </div>

                {/* Image Upload Field */}
                <div className="mb-3">
                    <label className="form-label">Upload Image</label>
                    <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*" // Only accept images
                        onChange={handleFileChange} 
                    />
                    <div className="form-text">Accepted formats: JPG, PNG</div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Uploading..." : "Publish Service"}
                </button>
            </form>
        </div>
    );
}