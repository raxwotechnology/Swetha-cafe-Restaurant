import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./KitchenLanding.css";
import "../styles/GlobalDesignSystem.css";
import API_BASE_URL from "../api.js";

const KitchenLanding = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // ← Loading on initial fetch
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Helper: Check if date is today
  const isToday = (dateString) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getDashOffset = (timeRemaining, timeLimit) => {
    if (timeRemaining <= 0) return 100;
    const percentage = (timeRemaining / timeLimit) * 100;
    return Math.max(0, Math.min(100, 100 - percentage));
  };

  // 🔁 Fetch orders — only show loading on FIRST fetch
  const fetchOrders = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/auth/orders?limit=200`, { // Large limit for ALL live orders
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both cases (plain array or paginated object)
      setOrders(res.data.orders || res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  // 🔁 Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchOrders(true); // Initial load with loading = true
    const interval = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ⏱️ Live countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const markAsReady = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/order/${id}/status`,
        { status: "Ready" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_BASE_URL}/api/auth/notifications/send`,
        {
          userId: id,
          message: `Order #${id} is ready for pickup.`,
          type: "update",
          role: "kitchen",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      alert("❌ Failed to update order status");
    }
  };

  // 🟢 New: Mark ALL live orders as Ready
  const markAllAsReady = async () => {
    const liveOrderIds = liveOrders.map((order) => order._id);
    if (liveOrderIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark all ${liveOrderIds.length} order(s) as Ready?`
    );
    if (!confirmed) return;

    setIsBulkUpdating(true); // 🔵 Start loading

    const token = localStorage.getItem("token");
    const updatePromises = liveOrderIds.map(async (id) => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/auth/order/${id}/status`,
          { status: "Ready" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await axios.post(
          `${API_BASE_URL}/api/auth/notifications/send`,
          {
            userId: id,
            message: `Order #${id} is ready for pickup.`,
            type: "update",
            role: "kitchen",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error(`Failed to update order ${id}:`, err);
      }
    });

    try {
      await Promise.allSettled(updatePromises);
      setOrders((prev) =>
        prev.filter((order) => !liveOrderIds.includes(order._id))
      );
      alert(`✅ ${liveOrderIds.length} order(s) marked as Ready!`);
    } catch (err) {
      console.error("Bulk update error:", err);
      alert("⚠️ Some orders may not have updated. Check console.");
    } finally {
      setIsBulkUpdating(false); // 🔴 Stop loading
    }
  };

  const liveOrders = orders.filter((order) =>
    ["Pending", "Processing"].includes(order.status)
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-primary fw-bold">Live Kitchen Orders</h2>
          <p className="text-muted mb-0">Manage and track active orders</p>
        </div>
      </div>

      {liveOrders.length > 0 && !loading && (
        <div className="d-flex justify-content-end mb-4">
          <button
            className="btn btn-success d-flex align-items-center"
            onClick={markAllAsReady}
            disabled={isBulkUpdating || liveOrders.length === 0}
          >
            {isBulkUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              `Mark All ${liveOrders.length} Order(s) as Ready`
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading live orders...</span>
          </div>
          <p className="mt-2 text-muted">Fetching active kitchen orders...</p>
        </div>
      ) : liveOrders.length === 0 ? (
        <div className="text-center my-5">
          <div className="mb-3">
            <span style={{ fontSize: "3rem" }}>✅</span>
          </div>
          <h5 className="text-muted">All caught up!</h5>
          <p className="text-muted">No pending or processing orders at the moment.</p>
        </div>
      ) : isBulkUpdating ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Processing...</span>
          </div>
          <p className="mt-2 text-muted">Processing orders...</p>
        </div>
      ) : (
        <div className="row g-4">
          {liveOrders.map((order) => {
            const createdAt = new Date(order.createdAt);
            const timeElapsed = currentTime - createdAt.getTime();
            const timeLimit = 30 * 60 * 1000; // 30 minutes
            const timeRemaining = timeLimit - timeElapsed;
            const isOverdue = timeRemaining <= 0;
            const orderIsFromToday = isToday(order.createdAt);

            return (
              <div key={order._id} className="col-md-6 col-lg-4">
                <div
                  className={`card h-100 ${isOverdue ? "border border-danger" : "border"
                    }`}
                >
                  <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span className="fw-semibold">Order #{order._id.slice(-5)}</span>
                      <span className={`badge ${isOverdue ? "badge-danger" : "badge-warning"} ms-2`}>{order.status}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="countdown-ring">
                        <svg viewBox="0 0 24 24" style={{ width: "32px", height: "32px" }}>
                          {/* Background Circle */}
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="2"
                          />
                          {/* Progress Arc */}
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke={isOverdue ? "#ef4444" : "#10b981"}
                            strokeWidth="2"
                            strokeDasharray="62.83"
                            strokeDashoffset={62.83 * (getDashOffset(timeRemaining, timeLimit) / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 12 12)"
                          />
                        </svg>
                      </div>
                      <div className={`ms-2 fw-bold ${isOverdue ? "text-danger" : "text-success"}`}>
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <p className="mb-2">
                      <strong>Customer:</strong> {order.customerName || "Walk-in"}
                    </p>
                    <p className="mb-3">
                      <strong>Table / Type:</strong>{" "}
                      {order.tableNo > 0 ? (
                        <span className="badge badge-primary">Table {order.tableNo}{order.waiterName ? ` - ${order.waiterName}` : ""}</span>
                      ) : (
                        <span className="badge badge-info">
                          Takeaway ({order.deliveryType})
                        </span>
                      )}
                    </p>

                    <ul className="list-group mb-3">
                      {order.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="list-group-item d-flex justify-content-between"
                        >
                          {item.name}
                          <span className="badge badge-secondary">{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`btn w-100 ${orderIsFromToday ? "btn-success" : "btn-danger"
                        }`}
                      onClick={() => markAsReady(order._id)}
                    >
                      {orderIsFromToday
                        ? "Mark as Ready"
                        : "Mark as Ready (Past Day)"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenLanding;