import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/global.css";
import "./styles/Navbar.css";
import "./styles/Footer.css";
import "./styles/Home.css";
import "./styles/Register.css";
import "./styles/Login.css";
import "./styles/Toast.css";

// 🚨 ADDED: Import CSS for the new Payment Flow pages
import "./styles/PaymentFlow.css"; 


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);