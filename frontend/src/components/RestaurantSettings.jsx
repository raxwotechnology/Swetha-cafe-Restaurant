import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { updateFavicon, notifySettingsUpdated } from "../utils/updateFavicon";
import LogoImage from "../upload/logo.png";

const RestaurantSettings = () => {
  const [name, setName] = useState("Swetha Cafe & Restaurant");
  const [address, setAddress] = useState("337C, Galle Road, Mt. Lavinia");
  const [phone, setPhone] = useState("0769 886 887");
  const [email, setEmail] = useState("aandafoods2026@gmail.com");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setName(res.data.name || "Swetha Cafe & Restaurant");
        setAddress(res.data.address || "337C, Galle Road, Mt. Lavinia");
        setPhone(res.data.phone || "0769 886 887");
        setEmail(res.data.email || "aandafoods2026@gmail.com");
        const currentLogo = res.data.logo || "";
        setLogo(currentLogo);
        if (currentLogo) updateFavicon(currentLogo);
      } catch (err) {
        console.error("Failed to load restaurant settings:", err.message);
        toast.error("Failed to load restaurant settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/auth/settings/restaurant`,
        { name, address, phone, email, logo },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (logo) {
        updateFavicon(logo);
      }
      notifySettingsUpdated();
      toast.success("Restaurant settings updated successfully!");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error("Failed to update restaurant settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4 fw-bold text-success border-bottom pb-2">🏢 Restaurant Configuration</h2>

      <div className="card shadow-sm p-4">
        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Swetha Cafe & Restaurant"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows="2"
              placeholder="e.g. 337C, Galle Road, Mt. Lavinia"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g. 0769 886 887"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aandafoods2026@gmail.com"
              className="form-control"
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Restaurant Logo</label>
            {logo ? (
              <div className="text-center mt-2">
                <div
                  style={{
                    maxWidth: "280px",
                    maxHeight: "120px",
                    borderRadius: "12px",
                    border: "2px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    padding: "10px",
                    overflow: "hidden",
                    backgroundColor: "#111",
                  }}
                >
                  <img
                    src={logo}
                    alt="Restaurant Logo"
                    style={{ maxWidth: "100%", maxHeight: "85px", width: "auto", height: "auto", objectFit: "contain" }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm mt-2"
                  onClick={handleRemoveLogo}
                >
                  🗑️ Remove Logo
                </button>
              </div>
            ) : (
              <div className="p-3 border rounded text-center bg-light">
                <p className="text-muted mb-2 small">No logo currently set (Logo removed)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="form-control form-control-sm"
                  style={{ maxWidth: "320px", margin: "0 auto" }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 fw-bold py-2"
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "💾 Save Settings"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RestaurantSettings;
