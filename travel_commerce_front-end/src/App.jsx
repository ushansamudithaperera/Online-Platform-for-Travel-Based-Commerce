import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Pages (as per your existing structure) */
import Home from "./pages/Home/Home";
 
import About from "./pages/About/About"; // Imported About
import Contact from "./pages/Contact/Contact"; // Imported Contact
import Feedback from "./pages/Feedback/Feedback"; // Imported Feedback
 
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AllServices from "./pages/Service/AllServices";
import ServiceDetails from "./pages/Service/ServiceDetails";
import TravellerDashboard from "./pages/Traveller/Dashboard";
import ProviderDashboard from "./pages/Provider/Dashboard";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/Dashboard";
import Toast from "./components/Toast";

// Payment Flow Components (updated)
import CheckoutPage from "./components/CheckoutPage.jsx";     
import PaymentSuccessPage from "./components/PaymentSuccessPage.jsx";

// Import the new ServiceFormModal if you want it as a standalone page (optional)
// import ServiceFormPage from "./pages/Provider/ServiceFormPage"; 

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
 
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/feedback" element={<Feedback />} />
 
      <Route path="/services" element={<AllServices />} />
      <Route path="/services/:id" element={<ServiceDetails />} />

      {/* Unified Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 💥 UPDATED: Payment Flow Routes with integrated form flow 💥 */}
      {/* Note: SelectPlanPage and PhotoUploadPage are now integrated into ProviderDashboard modal */}
      <Route path="/payment/checkout" element={<CheckoutPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute allowedRoles={["traveller"]} />}>
        <Route path="/traveller/dashboard" element={<TravellerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        {/* Optional: If you want a standalone service creation page */}
        {/* <Route path="/provider/services/new" element={<ServiceFormPage />} /> */}
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute allowedRoles={["admin" ,  "ROLE_ADMIN"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Service edit route (if you implement it later) */}
      <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
        <Route path="/services/:id/edit" element={<div>Edit Service Page (To be implemented)</div>} />
      </Route>

      <Route path="*" element={<div style={{ padding: 40 }}>404 - Not Found</div>} />

      {/* Temporary code part for testing */}
      <Route path="/testp" element={<ProviderDashboard />} />
      <Route path="/testt" element={<TravellerDashboard />} />

    </Routes>
  );
}