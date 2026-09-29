// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// import { AuthProvider } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/auth-context";
import App from "./App";
import axios from "axios";
import API_BASE_URL from "./api.js";
import "./styles/GlobalDesignSystem.css";

// Dynamically rewrite API URLs if REACT_APP_API_URL environment variable is provided
const apiUrl = process.env.REACT_APP_API_URL;
if (apiUrl) {
  const cleanApiUrl = apiUrl.replace(/\/$/, "");
  axios.interceptors.request.use(
    (config) => {
      if (config.url && config.url.includes(API_BASE_URL)) {
        config.url = config.url.replace(`${API_BASE_URL}`, cleanApiUrl);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);