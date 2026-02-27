
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles/global.css";
import "./styles/Navbar.css";
import "./styles/Footer.css";
import "./styles/Home.css";
import "./styles/Register.css";
import "./styles/Login.css";
import "./styles/Toast.css";
import "./styles/PaymentFlow.css";

import { GoogleOAuthProvider } from '@react-oauth/google';


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="442970760447-230ip7r1up9626qhrm0mue2urh8nu5lr.apps.googleusercontent.com">
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);