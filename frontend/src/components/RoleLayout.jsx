import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "./ProtectedRoute";
import useTokenCountdown from "../hooks/useTokenCountdown";
import {
  FaBars, FaSignOutAlt, FaTachometerAlt, FaUsers, FaKey, FaFileInvoice,
  FaChartBar, FaUserTie, FaCalendarCheck, FaTruck, FaMoneyBillWave,
  FaMoneyCheckAlt, FaUtensils, FaDollarSign, FaShoppingCart, FaHistory,
  FaBookOpen, FaClipboardList, FaUserCircle, FaPercentage, FaTruckLoading,
  FaFirstOrder, FaMotorcycle, FaUserClock, FaCashRegister, FaBookReader,
  FaCoins, FaWallet, FaPrint, FaUserTag, FaDatabase, FaChevronDown, FaChevronRight
} from "react-icons/fa";
import "./Sidebar.css";
import "../styles/GlobalDesignSystem.css";
import NotificationCenter from "./NotificationCenter";
import useRefreshStatus from "../hooks/useRefreshStatus";
import { FaRedo } from "react-icons/fa";
import axios from "axios";
import API_BASE_URL from "../api.js";
import { updateFavicon } from "../utils/updateFavicon";
import LogoImage from "../upload/logo.png";

const RoleLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const countdown = useTokenCountdown();
  const location = useLocation();
  const dropdownRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isHovered, setIsHovered] = useState(false);
  const { refreshed, markAsRefreshed } = useRefreshStatus();
  const [openGroups, setOpenGroups] = useState({});

  const [restaurantName, setRestaurantName] = useState("Swetha Cafe & Restaurant");
  const [restaurantLogo, setRestaurantLogo] = useState("");

  const handleHardRefresh = async () => {
    await markAsRefreshed();
    window.location.reload();
  };

  const fetchRestaurantDetails = async (forceRefresh = false) => {
    const CACHE_KEY    = "cached_restaurant_settings";
    const CACHE_TS_KEY = "cached_restaurant_settings_at";
    const TTL = 30 * 60 * 1000; // 30 minutes

    // Serve from cache if fresh and not a forced refresh
    if (!forceRefresh) {
      try {
        const cachedAt = localStorage.getItem(CACHE_TS_KEY);
        const cached   = localStorage.getItem(CACHE_KEY);
        if (cachedAt && cached && Date.now() - parseInt(cachedAt) < TTL) {
          const data = JSON.parse(cached);
          setRestaurantName(data.name || "Swetha Cafe & Restaurant");
          const logoUrl = data.logo || "";
          setRestaurantLogo(logoUrl);
          if (logoUrl) updateFavicon(logoUrl);
          return;
        }
      } catch {}
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`);
      if (res.data) {
        setRestaurantName(res.data.name || "Swetha Cafe & Restaurant");
        const logoUrl = res.data.logo || "";
        setRestaurantLogo(logoUrl);
        if (logoUrl) updateFavicon(logoUrl);
        // Save to cache
        try {
          localStorage.setItem(CACHE_KEY,    JSON.stringify(res.data));
          localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load restaurant settings in sidebar:", err);
    }
  };

  useEffect(() => {
    fetchRestaurantDetails();
    // Force-refresh when admin saves settings
    const onUpdate = () => fetchRestaurantDetails(true);
    window.addEventListener("restaurantSettingsUpdated", onUpdate);
    return () => {
      window.removeEventListener("restaurantSettingsUpdated", onUpdate);
    };
  }, []);

  const nameParts = restaurantName.split(" ");
  const brandName = nameParts[0] || "Swetha";
  const brandSub = nameParts.slice(1).join(" ") || "Cafe & Restaurant";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSidebarExpanded = sidebarOpen || (isHovered && !isMobile);

  const createMenuItem = (to, label, Icon) => {
    const isActive = location.pathname === to;
    return (
      <li title={!isSidebarExpanded ? label : ""} key={to}>
        <Link
          to={to}
          className={`menu-link ${isActive ? "active" : ""}`}
          onClick={() => isMobile && setSidebarOpen(false)}
        >
          <Icon className="menu-icon" />
          {isSidebarExpanded && <span className="menu-label">{label}</span>}
        </Link>
      </li>
    );
  };

  const toggleGroup = (groupKey) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const createGroup = (groupKey, label, Icon, items) => {
    // Check if any item in this group is active
    const isGroupActive = items.some(([to]) => location.pathname === to);
    const isOpen = openGroups[groupKey] ?? isGroupActive;

    if (!isSidebarExpanded) {
      // In collapsed mode, show all items flat (no group headers)
      return items.map(([to, itemLabel, ItemIcon]) => createMenuItem(to, itemLabel, ItemIcon));
    }

    return (
      <li key={groupKey} className="menu-group">
        <button
          className={`menu-group-header ${isGroupActive ? "active" : ""}`}
          onClick={() => toggleGroup(groupKey)}
        >
          <Icon className="menu-icon" />
          <span className="menu-label">{label}</span>
          <span className="group-chevron">
            {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </span>
        </button>
        {isOpen && (
          <ul className="menu-sub">
            {items.map(([to, itemLabel, ItemIcon]) => createMenuItem(to, itemLabel, ItemIcon))}
          </ul>
        )}
      </li>
    );
  };

  const renderSidebarMenu = () => {
    switch (user?.role) {
      case "admin":
        return (
          <>
            {createMenuItem("/admin", "Dashboard", FaTachometerAlt)}
            {createMenuItem("/cashier/today", "Daily Report", FaBookOpen)}

            {createGroup("orders", "Orders", FaShoppingCart, [
              ["/cashier", "Order Management", FaCashRegister],
              ["/kitchen", "Live Orders", FaShoppingCart],
              ["/cashier/orders", "Order History", FaHistory],
              ["/cashier/takeaway-orders", "Takeaway Orders", FaFirstOrder],
              ["/cashier-summery", "Cashier Summary", FaBookReader],
            ])}

            {createGroup("menu", "Menu & Kitchen", FaUtensils, [
              ["/kitchen/menu", "Manage Menu", FaClipboardList],
            ])}

            {createGroup("people", "People", FaUserTie, [
              ["/admin/users", "User Management", FaUsers],
              ["/admin/customers", "Customers", FaUserTag],
              ["/admin/employees", "Employees", FaUserTie],
              ["/cashier/driver-register", "Driver Register", FaMotorcycle],
            ])}

            {createGroup("attendance", "Attendance", FaCalendarCheck, [
              ["/kitchen/attendance/add", "Live Attendance", FaUserClock],
              ["/admin/attendance", "Attendance History", FaCalendarCheck],
            ])}

            {createGroup("finance", "Finance", FaMoneyBillWave, [
              ["/cashier/other-income", "Other Incomes", FaCoins],
              ["/cashier/other-expences", "Other Expenses", FaWallet],
              ["/admin/expenses", "Supplier Expenses", FaMoneyBillWave],
              ["/admin/bills", "Restaurant Bills", FaFileInvoice],
              ["/admin/salaries", "Salary Payments", FaMoneyCheckAlt],
            ])}

            {createGroup("suppliers", "Suppliers", FaTruck, [
              ["/admin/suppliers", "Suppliers Register", FaTruck],
            ])}

            {createGroup("reports", "Reports", FaChartBar, [
              ["/admin/report", "Monthly Report", FaChartBar],
            ])}

            {createGroup("settings", "Settings", FaKey, [
              ["/admin/service-charge", "Service Charge", FaPercentage],
              ["/admin/delivery-charges", "Delivery Charge", FaTruckLoading],
              ["/printer-settings", "Printer Settings", FaPrint],
              ["/admin/signup-key", "Signup Key", FaKey],
              ["/admin/restaurant-settings", "Restaurant Settings", FaUtensils],
              ["/admin/currency", "Currency", FaDollarSign],
              ["/admin/db-Status", "Database Status", FaDatabase],
              ["/admin/refresh-update", "Update Refresh", FaRedo],
            ])}
          </>
        );
      case "cashier":
        return (
          <>
            {createMenuItem("/cashier", "Order Management", FaCashRegister)}
            {createMenuItem("/kitchen", "Live Orders", FaShoppingCart)}
            {createMenuItem("/cashier/orders", "Order History", FaHistory)}
            {createMenuItem("/cashier/takeaway-orders", "Takeaway Orders", FaFirstOrder)}
            {createMenuItem("/cashier/today", "Daily Report", FaBookOpen)}
            {createMenuItem("/cashier-summery", "Cashier Summary", FaBookReader)}

            {createGroup("finance", "Finance", FaMoneyBillWave, [
              ["/cashier/other-income", "Other Incomes", FaCoins],
              ["/cashier/other-expences", "Other Expenses", FaWallet],
            ])}

            {createMenuItem("/kitchen/menu", "Manage Menu", FaClipboardList)}
            {createMenuItem("/cashier/driver-register", "Driver Register", FaMotorcycle)}
            {createMenuItem("/kitchen/kitchen-requestsForm", "Admin Requests", FaUtensils)}
            {createMenuItem("/kitchen/attendance/add", "Live Attendance", FaUserClock)}
            {createMenuItem("/printer-settings", "Printer Settings", FaPrint)}
          </>
        );
      case "kitchen":
        return (
          <>
            {createMenuItem("/kitchen", "Live Orders", FaShoppingCart)}
            {createMenuItem("/kitchen/history", "Order History", FaHistory)}
            {createMenuItem("/kitchen/menu", "Manage Menu", FaClipboardList)}
            {createMenuItem("/kitchen/kitchen-requestsForm", "Admin Requests", FaUtensils)}
            {createMenuItem("/kitchen/attendance/add", "Attendance", FaUserClock)}
          </>
        );
      default:
        return null;
    }
  };

  const getSidebarClass = () => {
    const isOpen = sidebarOpen || (isHovered && !isMobile);
    return isOpen ? "open" : "collapsed";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (!sidebarOpen) setIsHovered(false);
  };

  return (
    <div className="layout d-flex">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      {!isMobile || sidebarOpen ? (
        <aside
          className={`sidebar ${getSidebarClass()}`}
          onMouseEnter={() => !isMobile && !sidebarOpen && setIsHovered(true)}
          onMouseLeave={() => !isMobile && !sidebarOpen && setIsHovered(false)}
        >
          <div className="sidebar-header d-flex align-items-center">
            {restaurantLogo ? (
              <img
                src={restaurantLogo}
                alt="Logo"
                className="sidebar-logo flex-shrink-0 rounded-2"
                style={{ objectFit: "contain", maxWidth: isSidebarExpanded ? "140px" : "42px", maxHeight: "42px", width: "auto", height: "auto" }}
              />
            ) : (
              <div
                className="sidebar-logo-fallback flex-shrink-0 rounded-2 d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.1)", color: "#e85d04" }}
              >
                <FaUtensils size={18} />
              </div>
            )}
            {isSidebarExpanded && (
              <div className="sidebar-brand ms-2">
                <div className="sidebar-brand-name" style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{brandName}</div>
                <div className="sidebar-brand-sub" style={{ fontSize: "0.75rem", opacity: 0.8 }}>{brandSub}</div>
              </div>
            )}
          </div>
          <ul className="sidebar-menu">{renderSidebarMenu()}</ul>
        </aside>
      ) : null}

      <div className="main-content flex-grow-1">
        <header className="top-navbar">
          <div className="navbar-left">
            <button className="btn-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <span className="session-timer">⏳ Session expires in: {countdown}</span>
            <div>
              <NotificationCenter />
            </div>
            <button
              className="btn btn-outline-secondary ms-2 d-flex align-items-center justify-content-center position-relative"
              onClick={handleHardRefresh}
              title="Hard refresh page"
              style={{ width: "36px", height: "36px", padding: 0 }}
            >
              <FaRedo />
              {!refreshed && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "0.65em", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  1
                </span>
              )}
            </button>
          </div>
          <div className="navbar-right" ref={dropdownRef}>
            <div className="user-dropdown">
              <div
                className="user-toggle"
                onClick={() => setUserDropdown(!userDropdown)}
                style={{ cursor: "pointer" }}
              >
                <FaUserCircle className="user-icon" />
                <span className="user-role">{user?.role}</span>
              </div>
              {userDropdown && (
                <div className="dropdown-menu show">
                  <button className="dropdown-item" onClick={logout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleLayout;
