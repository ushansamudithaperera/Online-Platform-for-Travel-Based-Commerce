import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Pages */
import Home from "./pages/Home/Home";
import About from "./pages/About/About"; // Imported About
import Contact from "./pages/Contact/Contact"; // Imported Contact
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AllServices from "./pages/Service/AllServices";
import ServiceDetails from "./pages/Service/ServiceDetails";
import TravellerDashboard from "./pages/Traveller/Dashboard";
import ProviderDashboard from "./pages/Provider/Dashboard";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/Dashboard";
import Toast from "./components/Toast";

// --- 1. ADD THIS IMPORT ---
import AddService from "./pages/Provider/AddService"; 
// --------------------------

import SelectPlanPage from "./components/SelectPlanPage.jsx"; 
import PhotoUploadPage from "./components/PhotoUploadPage.jsx"; 
import CheckoutPage from "./components/CheckoutPage.jsx";     
import PaymentSuccessPage from "./components/PaymentSuccessPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<AllServices />} />
      <Route path="/services/:id" element={<ServiceDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Payment Flow Routes */}
      <Route path="/payment/select-plan" element={<SelectPlanPage />} />
      <Route path="/post/add-photos" element={<PhotoUploadPage />} /> 
      <Route path="/payment/checkout" element={<CheckoutPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["traveller"]} />}>
        <Route path="/traveller/dashboard" element={<TravellerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        
        {/* --- 2. ADD THIS ROUTE --- */}
        {/* This connects the URL to your new page */}
        <Route path="/add-service" element={<AddService />} />
        {/* ------------------------- */}
        
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<div style={{ padding: 40 }}>404 - Not Found</div>} />

      {/* Temporary Test Routes */}
      <Route path="/testp" element={<ProviderDashboard />} />
      <Route path="/testt" element={<TravellerDashboard />} />
    </Routes>
  );
}










































// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";

// /* Pages (as per your existing structure) */
// import Home from "./pages/Home/Home";
// import Login from "./pages/Auth/Login";
// import Register from "./pages/Auth/Register";
// import AllServices from "./pages/Service/AllServices";
// import ServiceDetails from "./pages/Service/ServiceDetails";
// import TravellerDashboard from "./pages/Traveller/Dashboard";
// import ProviderDashboard from "./pages/Provider/Dashboard";
// import AdminLogin from "./pages/Admin/AdminLogin";
// import AdminDashboard from "./pages/Admin/Dashboard";
// import Toast from "./components/Toast";

// // --- THIS IS THE NEW IMPORT IMAGE UPLOAD ---
// import AddService from "./pages/Provider/AddService"; 
// // --------------------------


// // 🚨 CORRECTED IMPORTS: New components are imported from the 'components' folder
// import SelectPlanPage from "./components/SelectPlanPage.jsx"; 
// import PhotoUploadPage from "./components/PhotoUploadPage.jsx"; // 🌟 NEW IMPORT ADDED HERE
// import CheckoutPage from "./components/CheckoutPage.jsx";     
// import PaymentSuccessPage from "./components/PaymentSuccessPage.jsx";

// import ProtectedRoute from "./components/ProtectedRoute";
// import { useAuth } from "./context/AuthContext";


// export default function App() {
//   const { user } = useAuth();

//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />

//       {/* Public service pages */}
//       <Route path="/services" element={<AllServices />} />
//       <Route path="/services/:id" element={<ServiceDetails />} />

//       {/* Unified Auth pages */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />

//       {/* 💥 FIX: Payment Flow Routes with the missing Photo Upload route 💥 */}
//       <Route path="/payment/select-plan" element={<SelectPlanPage />} />
//       
//       {/* 🌟 THE MISSING ROUTE IS ADDED HERE, resolving the 404 error */}
//       <Route path="/post/add-photos" element={<PhotoUploadPage />} /> 
      
//       <Route path="/payment/checkout" element={<CheckoutPage />} />
//       <Route path="/payment/success" element={<PaymentSuccessPage />} />

//       {/* Protected routes */}
//       <Route element={<ProtectedRoute allowedRoles={["traveller"]} />}>
//         <Route path="/traveller/dashboard" element={<TravellerDashboard />} />
//       </Route>

//       <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
//         <Route path="/provider/dashboard" element={<ProviderDashboard />} />
//       </Route>


//       {/* Admin */}
//       <Route path="/admin/login" element={<AdminLogin />} />
//       <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
//         <Route path="/admin/dashboard" element={<AdminDashboard />} />
//       </Route>

//       <Route path="*" element={<div style={{ padding: 40 }}>404 - Not Found</div>} />


//       {/*Temporory code part for testing */}
//       <Route path="/testp" element={<ProviderDashboard />} />
//       <Route path="/testt" element={<TravellerDashboard />} />


//     </Routes>
//   );
// }