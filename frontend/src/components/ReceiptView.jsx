import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api.js";
import LogoImage from "../upload/logo.png";

const ReceiptView = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "Swetha Cafe & Restaurant",
    address: "337C, Galle Road, Mt. Lavinia",
    phone: "0769 886 887",
    email: "aandafoods2026@gmail.com",
    logo: ""
  });

  const orderId = window.location.pathname.split("/").pop();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Order
        const orderRes = await axios.get(`${API_BASE_URL}/api/auth/order/${orderId}`, { headers });
        setOrder(orderRes.data);

        // Fetch Restaurant Details
        try {
          const restRes = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, { headers });
          if (restRes.data) {
            setRestaurantDetails({
              name: restRes.data.name || "Swetha Cafe & Restaurant",
              address: restRes.data.address || "337C, Galle Road, Mt. Lavinia",
              phone: restRes.data.phone || "0769 886 887",
              email: restRes.data.email || "aandafoods2026@gmail.com",
              logo: restRes.data.logo || ""
            });
          }
        } catch (e) {
          console.error("Failed to load restaurant details in ReceiptView:", e);
        }

        window.print();
      } catch (err) {
        console.error("Failed to load order:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return null;

  const symbol = localStorage.getItem("currencySymbol") || "Rs.";
  const dailyNo = order.dailyOrderNo != null ? order.dailyOrderNo : (order.invoiceNo ? order.invoiceNo.split('-').pop() : '1');
  const logoSrc = restaurantDetails.logo || "";

  return (
    <div style={{ maxWidth: "300px", margin: "auto", padding: "10px", fontFamily: "Calibri, sans-serif" }}>
      {logoSrc && (
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <img
            src={logoSrc}
            alt="Logo"
            style={{ maxWidth: "180px", maxHeight: "80px", width: "auto", height: "auto", objectFit: "contain" }}
          />
        </div>
      )}
      <h3 className="text-center" style={{ margin: "5px 0", fontSize: "20px" }}><strong>{restaurantDetails.name}</strong></h3>
      <p className="text-center" style={{ margin: "2px 0", fontSize: "13px" }}>{restaurantDetails.address}</p>
      <p className="text-center" style={{ margin: "2px 0 10px 0", fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
      <hr />

      <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", margin: "6px 0", border: "1px dashed #000", padding: "4px 0" }}>
        DAILY TOKEN #: #{dailyNo}
      </div>
      
      <table style={{ width: "100%", fontSize: "13px", margin: "6px 0" }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold", width: "90px" }}>Invoice:</td>
            <td>{order.invoiceNo || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Date:</td>
            <td>{new Date(order.createdAt || order.date || Date.now()).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Customer:</td>
            <td>{order.customerName || "Walk-in"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Phone:</td>
            <td>{order.customerPhone || "N/A"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Table:</td>
            <td>{order.tableNo > 0 ? `Table ${order.tableNo}` : "Takeaway"}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <table style={{ width: "100%", fontSize: "13px" }}>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ textAlign: "left", padding: "3px 0" }}>{item.name} x{item.quantity}</td>
              <td style={{ textAlign: "right", padding: "3px 0" }}>{symbol}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <h5 style={{ textAlign: "right", fontSize: "16px", fontWeight: "bold" }}>Total: {symbol}{order.totalPrice?.toFixed(2)}</h5>
      <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", fontWeight: "bold" }}>Thank you for your visit!</p>
    </div>
  );
};

export default ReceiptView;