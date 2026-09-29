// src/components/CashierLogin.jsx
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./LoginStyles.css";
import API_BASE_URL from "../api.js";
import LogoImage from "../upload/logo.png";

const CashierLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "Swetha Cafe & Restaurant",
    logo: ""
  });

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`);
        if (res.data) {
          setRestaurantDetails({
            name: res.data.name || "Swetha Cafe & Restaurant",
            logo: res.data.logo || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings on login:", err);
      }
    };
    fetchRestaurantSettings();
  }, []);

  const logoSrc = restaurantDetails.logo || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const data = res.data;

      if (data.role !== "cashier") {
        alert("Unauthorized access");
        setLoading(false);
        return;
      }

      login(data);
      navigate("/cashier");
    } catch (err) {
      alert("Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left panel: brand / background */}
      <div className="login-brand-panel">
        <div className="login-brand-overlay" />
        <div className="login-brand-content">
          {logoSrc && (
            <div className="login-brand-logo-ring">
              <img src={logoSrc} alt="Restaurant Logo" />
            </div>
          )}
          <h1 className="login-brand-name">{restaurantDetails.name}</h1>
          <p className="login-brand-tagline">GOOD FOOD • GOOD MOOD • GREAT MEMORIES</p>
        </div>
      </div>

      {/* Right panel: login card */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-header">
            <span className="login-role-badge cashier">Cashier Portal</span>
            <h2 className="login-title">Sign In</h2>
          </div>

          <div className="login-divider" />

          <form onSubmit={handleLogin} className="login-form">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="cashier@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">Don't have an account?{" "}
              <Link to="/signup?role=cashier" className="login-footer-link">Sign Up</Link>
            </p>
            <Link to="/forgot-password" className="login-footer-link">Forgot your password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierLogin;
