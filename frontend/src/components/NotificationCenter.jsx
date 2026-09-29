import React, { useState, useEffect, useRef } from "react";
import useNotifications from "../hooks/useNotification";
import { FaBell, FaRegBell } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    userRole,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  // Mark all as read when dropdown opens
  const toggleDropdown = () => {
    if (!showDropdown && unreadCount > 0) {
      // markAllAsRead();
    }
    setShowDropdown(!showDropdown);
  };

  // Get icon per type
  const getIcon = (type) => {
    const icons = {
      order: "🛒",
      stock: "📦",
      table: "🪑",
      cleaning: "🧼",
      task: "📋",
      payment: "💳",
      update: "🔧"
    };
    return icons[type] || "🔔";
  };

  return (
    <>
      {/* Bell Button */}
      <div className="position-relative" style={{ display: "inline-block" }}>
        <button
          onClick={toggleDropdown}
          style={{
            fontSize: "1.2rem",
            color: "#495057",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            lineHeight: 1,
          }}
          type="button"
        >
          {unreadCount > 0 ? <FaBell /> : <FaRegBell />}
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                fontSize: "0.6rem",
                padding: "2px 5px",
                borderRadius: "50%",
                backgroundColor: "red",
                color: "white",
                lineHeight: 1.2,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Centered Modal Panel */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26,26,46,0.45)",
              backdropFilter: "blur(2px)",
              zIndex: 1040,
            }}
          />

          {/* Panel — fixed centre of viewport */}
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(420px, 92vw)",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#FDFBF8",
              borderRadius: "14px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              border: "1px solid rgba(201,168,76,0.25)",
              zIndex: 1050,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px 12px",
              borderBottom: "1px solid #EDE9E3",
              background: "#1A1A2E",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaBell style={{ color: "#C9A84C", fontSize: "1rem" }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", letterSpacing: "0.02em" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    background: "#8B1A1A", color: "#fff",
                    fontSize: "0.65rem", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "10px",
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", cursor: "pointer", lineHeight: 1, padding: "2px 4px" }}
              >✕</button>
            </div>

            {/* Scrollable list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#9090A8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "11px 18px",
                      borderBottom: "1px solid #F0EDE8",
                      cursor: notif.read ? "default" : "pointer",
                      background: notif.read ? "transparent" : "rgba(139,26,26,0.04)",
                      borderLeft: notif.read ? "3px solid transparent" : "3px solid #8B1A1A",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem", flexShrink: 0, lineHeight: 1.3 }}>{getIcon(notif.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.85rem",
                        fontWeight: notif.read ? 400 : 600,
                        color: "#1A1A2E",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#9090A8", marginTop: "3px" }}>
                        {new Date(notif.createdAt).toLocaleString([], {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                    {!notif.read && (
                      <span style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "#8B1A1A", flexShrink: 0, marginTop: "5px",
                      }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "12px 18px",
              borderTop: "1px solid #EDE9E3",
              background: "#FDFBF8",
              flexShrink: 0,
            }}>
              <button
                style={{
                  width: "100%", padding: "9px", borderRadius: "8px",
                  background: unreadCount === 0 ? "#ccc" : "#2E7D32",
                  color: "#fff", border: "none", fontWeight: 600,
                  fontSize: "0.85rem", cursor: unreadCount === 0 ? "not-allowed" : "pointer",
                  fontFamily: "inherit", letterSpacing: "0.02em",
                }}
                disabled={unreadCount === 0}
                onClick={markAllAsRead}
              >
                Mark All as Read
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NotificationCenter;