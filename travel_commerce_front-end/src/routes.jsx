import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* pages */
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import AllServices from "./pages/Service/AllServices.jsx";
import ServiceDetails from "./pages/Service/ServiceDetails.jsx";

/* dashboards / admin */
import TravellerDashboard from "./pages/Traveller/TravellerDashboard.jsx";
import ProviderDashboard from "./pages/Provider/ProviderDashboard.jsx";
import AdminLogin from "./pages/Admin/AdminLogin.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";

/* payment flow */
import CheckoutPage from "./components/CheckoutPage.jsx";
import PaymentSuccessPage from "./components/PaymentSuccessPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function RoutesElement() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/services" element={<AllServices />} />
      <Route path="/services/:id" element={<ServiceDetails />} />

      <Route path="/login" element={<Navigate to="/login/general" replace />} />
      <Route path="/register" element={<Navigate to="/register/general" replace />} />

      <Route path="/login/general" element={<Login />} />
      <Route path="/register/general" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["traveller"]} />}>
        <Route path="/traveller/dashboard" element={<TravellerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/payment/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<div style={{ padding: 40 }}>404 - Not Found</div>} />
    </Routes>
  );
}
