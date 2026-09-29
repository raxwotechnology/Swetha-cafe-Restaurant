import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LogoImage from "../upload/logo.png";
import axios from "axios";
import API_BASE_URL from "../api.js";

const Home = () => {
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "Swetha Cafe & Restaurant",
    logo: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`);
        if (res.data) {
          setRestaurantDetails({
            name: res.data.name || "Swetha Cafe & Restaurant",
            logo: res.data.logo || ""
          });
        }
      } catch (err) {
        console.error("Failed to load settings on Home page:", err);
      }
    };
    fetchSettings();
  }, []);

  const logoSrc = restaurantDetails.logo || null;
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .home-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1A1A2E 0%, #2D1515 50%, #1A1A2E 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        .home-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139,26,26,0.15) 0%, transparent 50%),
            radial-gradient(circle at 60% 80%, rgba(201,168,76,0.04) 0%, transparent 40%);
          pointer-events: none;
        }

        /* Decorative corner ornaments */
        .home-page::after {
          content: '❧';
          position: absolute;
          top: 24px; right: 32px;
          font-size: 2rem;
          color: rgba(201,168,76,0.15);
          pointer-events: none;
        }

        .home-card {
          background: rgba(253,251,248,0.97);
          border-radius: 20px;
          padding: 48px 40px 40px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.2);
          position: relative;
          text-align: center;
        }

        .home-card::before {
          content: '';
          position: absolute;
          top: 0; left: 40px; right: 40px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #C9A84C, transparent);
          border-radius: 0 0 4px 4px;
        }

        .logo-ring {
          max-width: 240px;
          max-height: 120px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #C9A84C;
          box-shadow: 0 0 0 4px rgba(201,168,76,0.15), 0 8px 32px rgba(0,0,0,0.15);
          margin: 0 auto 24px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.7);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .logo-ring img {
          max-width: 100%;
          max-height: 100px;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .home-brand {
          font-family: 'Poppins', sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: #1A1A2E;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .home-subtitle {
          font-size: 0.75rem;
          font-weight: 600;
          color: #C9A84C;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin: 0 0 6px;
        }

        .home-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 28px;
          color: #C0B090;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .home-divider::before,
        .home-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #C9A84C88, transparent);
        }

        .role-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          border: 2px solid transparent;
          cursor: pointer;
        }

        .role-btn-admin {
          background: #8B1A1A;
          color: #fff;
          border-color: #8B1A1A;
        }

        .role-btn-admin:hover {
          background: #6B1212;
          color: #F5E8C0;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139,26,26,0.3);
        }

        .role-btn-cashier {
          background: transparent;
          color: #8B1A1A;
          border-color: #8B1A1A;
        }

        .role-btn-cashier:hover {
          background: #8B1A1A;
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139,26,26,0.2);
        }

        .role-btn-kitchen {
          background: #1A1A2E;
          color: #C9A84C;
          border-color: #1A1A2E;
        }

        .role-btn-kitchen:hover {
          background: #0f0f1e;
          color: #E8C96A;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26,26,46,0.3);
        }

        .btn-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .signup-section {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #EDE9E3;
        }

        .signup-label {
          font-size: 0.72rem;
          color: #9090A8;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .signup-links {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .signup-link {
          font-size: 0.78rem;
          color: #5A5A72;
          text-decoration: none;
          padding: 5px 12px;
          border: 1px solid #EDE9E3;
          border-radius: 20px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .signup-link:hover {
          border-color: #C9A84C;
          color: #8B1A1A;
          background: #FFF8E8;
        }

        @media (max-width: 480px) {
          .home-card {
            padding: 36px 24px 32px;
            border-radius: 16px;
          }
          .home-brand { font-size: 1.6rem; }
          .logo-ring { width: 90px; height: 90px; }
        }
      `}</style>

      <div className="home-page">
        <div className="home-card">
          {logoSrc && (
            <div className="logo-ring">
              <img src={logoSrc} alt="Logo" />
            </div>
          )}

          <div className="home-subtitle">Restaurant Management System</div>
          <h1 className="home-brand">{restaurantDetails.name}</h1>

          <div className="home-divider">Select Your Role</div>

          <div className="btn-stack">
            <Link to="/admin-login" className="role-btn role-btn-admin">
              Admin Login
            </Link>
            <Link to="/cashier-login" className="role-btn role-btn-cashier">
              Cashier Login
            </Link>
            <Link to="/kitchen-login" className="role-btn role-btn-kitchen">
              Kitchen Login
            </Link>
          </div>

          <div className="signup-section">
            <p className="signup-label">New user? Register as</p>
            <div className="signup-links">
              <Link to="/signup?role=cashier" className="signup-link">Cashier</Link>
              <Link to="/signup?role=kitchen" className="signup-link">Kitchen Staff</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
