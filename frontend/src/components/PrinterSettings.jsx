// src/components/PrinterSettings.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API_BASE_URL from "../api.js";
import {
  isSerialSupported,
  connectCustomerDisplay,
  disconnectCustomerDisplay,
  autoConnectCustomerDisplay,
  subscribeCustomerDisplayStatus,
  showWelcomeMessage,
  showItemDisplay,
  showTotalDisplay,
  clearCustomerDisplay
} from "../utils/customerDisplay";

const PrinterSettings = () => {
  const [savedPrinters, setSavedPrinters] = useState([]);
  const [systemPrinters, setSystemPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [selectedRole, setSelectedRole] = useState("cashier");
  const [loadingQZ, setLoadingQZ] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wi-Fi Printer state
  const [wifiPrinter, setWifiPrinter] = useState({
    name: "Kitchen Wi-Fi Printer",
    ipAddress: "",
    port: 9100,
    role: "kitchen",
    type: "wifi_network"
  });
  const [savingWifi, setSavingWifi] = useState(false);
  const [testingWifiId, setTestingWifiId] = useState(null);

  const [displayConnected, setDisplayConnected] = useState(false);

  useEffect(() => {
    fetchSavedPrinters();
    loadSystemPrinters();
    const unsubscribe = subscribeCustomerDisplayStatus((connected) => {
      setDisplayConnected(connected);
    });
    autoConnectCustomerDisplay();
    return () => unsubscribe();
  }, []);

  const fetchSavedPrinters = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/auth/printers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPrinters(res.data);

      // Pre-fill existing kitchen wifi printer if saved
      const existingWifi = res.data.find(p => p.role === "kitchen" && p.type === "wifi_network");
      if (existingWifi) {
        setWifiPrinter({
          _id: existingWifi._id,
          name: existingWifi.name || "Kitchen Wi-Fi Printer",
          ipAddress: existingWifi.ipAddress || "",
          port: existingWifi.port || 9100,
          role: "kitchen",
          type: "wifi_network"
        });
      }
    } catch (err) {
      console.error("Failed to load saved printers:", err.message);
      toast.error("Failed to load saved printers");
    }
  };

  const loadSystemPrinters = async () => {
    if (typeof qz === "undefined") return;

    setLoadingQZ(true);
    try {
      await qz.websocket.connect();
      const printers = await qz.printers.find();
      setSystemPrinters(printers);
      if (printers.length > 0) {
        setSelectedPrinter(printers[0]);
      }
    } catch (err) {
      console.warn("QZ Tray not available:", err.message);
    } finally {
      try {
        await qz.websocket.disconnect();
      } catch (e) {}
      setLoadingQZ(false);
    }
  };

  const handleSaveSystemPrinter = async () => {
    if (!selectedPrinter.trim()) {
      toast.error("Please select a printer");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: selectedPrinter,
        type: "qz_tray",
        role: selectedRole
      };
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/printers`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem("cached_printers");
      fetchSavedPrinters();
      toast.success(`✅ ${selectedRole === "kitchen" ? "Kitchen (KOT)" : "Cashier"} Printer saved successfully!`);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save printer";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWifiPrinter = async (e) => {
    e.preventDefault();
    if (!wifiPrinter.ipAddress.trim()) {
      toast.error("Please enter Wi-Fi Printer IP Address");
      return;
    }

    setSavingWifi(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        id: wifiPrinter._id,
        name: wifiPrinter.name,
        ipAddress: wifiPrinter.ipAddress.trim(),
        port: parseInt(wifiPrinter.port, 10) || 9100,
        type: "wifi_network",
        role: "kitchen"
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/printers`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWifiPrinter(prev => ({ ...prev, _id: res.data._id }));
      localStorage.removeItem("cached_printers");
      fetchSavedPrinters();
      toast.success("✅ Kitchen Wi-Fi Printer configured successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save Kitchen Wi-Fi Printer");
    } finally {
      setSavingWifi(false);
    }
  };

  const handleTestWifiPrint = async (printerId) => {
    setTestingWifiId(printerId);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/printers/${printerId}/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "✅ Test ticket sent to Kitchen Printer!");
    } catch (err) {
      toast.error(err.response?.data?.error || "❌ Failed to connect to Kitchen Printer");
    } finally {
      setTestingWifiId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this saved printer?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/auth/printers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem("cached_printers");
      fetchSavedPrinters();
      toast.success("Printer deleted");
    } catch (err) {
      toast.error("Failed to delete printer");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold text-success border-bottom pb-2">🖨️ Printer & Peripheral Settings</h2>

      {/* Kitchen Wi-Fi Printer Setup */}
      <div className="card p-4 mb-4 shadow-sm border-0 bg-white rounded-3">
        <h4 className="mb-3 text-warning fw-bold">🍳 Kitchen Wi-Fi Printer (KOT Auto-Print)</h4>
        <p className="text-muted small mb-3">
          Configure your <strong>Kitchen Thermal Printer</strong> connected via Wi-Fi / Local Network IP.
          When a cashier places an order, the system will automatically send real-time Kitchen Order Tickets (KOT) directly over your local network!
        </p>

        <form onSubmit={handleSaveWifiPrinter}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Printer Display Name</label>
              <input
                type="text"
                className="form-control"
                value={wifiPrinter.name}
                onChange={(e) => setWifiPrinter({ ...wifiPrinter, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Printer Local IP Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 192.168.1.100"
                value={wifiPrinter.ipAddress}
                onChange={(e) => setWifiPrinter({ ...wifiPrinter, ipAddress: e.target.value })}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">TCP Port</label>
              <input
                type="number"
                className="form-control"
                value={wifiPrinter.port}
                onChange={(e) => setWifiPrinter({ ...wifiPrinter, port: e.target.value })}
                required
              />
            </div>
            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-warning w-100 fw-bold"
                disabled={savingWifi}
              >
                {savingWifi ? "Saving..." : "💾 Save Kitchen Printer"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* System QZ Tray Printer Selector */}
      <div className="card p-4 mb-4 shadow-sm border-0 bg-white rounded-3">
        <h4 className="mb-3 text-primary fw-bold">🧾 USB / Local Printers (QZ Tray)</h4>
        <p className="text-muted small mb-3">
          Configure thermal printers connected to this PC via USB or driver. You can designate printers for either <strong>Cashier (Customer Bill)</strong> or <strong>Kitchen (KOT - Items & Qty Only)</strong>.
        </p>
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label fw-semibold">Available Printers</label>
            <select
              className="form-select"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={loadingQZ}
            >
              <option value="">— Select a printer —</option>
              {systemPrinters.length > 0 ? (
                systemPrinters.map((printer, i) => (
                  <option key={i} value={printer}>
                    {printer}
                  </option>
                ))
              ) : (
                <option disabled>No QZ Tray printers found</option>
              )}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Printer Role</label>
            <select
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="cashier">🧾 Cashier (Customer Bill)</option>
              <option value="kitchen">🍳 Kitchen (KOT - Items & Qty Only)</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-primary w-100"
              onClick={loadSystemPrinters}
              disabled={loadingQZ}
            >
              {loadingQZ ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-primary w-100 fw-bold"
              onClick={handleSaveSystemPrinter}
              disabled={!selectedPrinter || saving}
            >
              {saving ? "Saving..." : "💾 Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Saved Printers List */}
      <div className="card p-4 mb-4 shadow-sm border-0 bg-white rounded-3">
        <h4 className="mb-3 text-secondary fw-bold">📋 Configured Printers</h4>
        {savedPrinters.length === 0 ? (
          <div className="alert alert-info mb-0">No printers saved yet.</div>
        ) : (
          <div className="table-responsive shadow-sm rounded border">
            <table className="table table-bordered table-striped align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>IP / Connection</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedPrinters.map((printer) => (
                  <tr key={printer._id}>
                    <td className="fw-semibold">{printer.name}</td>
                    <td>
                      <span className={`badge ${printer.type === 'wifi_network' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                        {printer.type === 'wifi_network' ? '📶 Wi-Fi / Network' : '🖥️ QZ Tray / USB'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${printer.role === 'kitchen' ? 'bg-danger' : 'bg-success'}`}>
                        {printer.role === 'kitchen' ? '🍳 Kitchen (KOT)' : '🧾 Cashier (Receipt)'}
                      </span>
                    </td>
                    <td>{printer.ipAddress ? `${printer.ipAddress}:${printer.port || 9100}` : "Local / USB"}</td>
                    <td className="text-center">
                      {printer.type === 'wifi_network' && (
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => handleTestWifiPrint(printer._id)}
                          disabled={testingWifiId === printer._id}
                        >
                          {testingWifiId === printer._id ? "Printing..." : "🖨️ Test KOT Print"}
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(printer._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VFD Customer Display Card */}
      <div className="card p-4 mb-4 shadow-sm border-0 bg-white rounded-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0 text-success fw-bold">📺 TP-210CE VFD Customer Display</h4>
          <span className={`badge px-3 py-2 fs-6 ${displayConnected ? "bg-success" : "bg-secondary"}`}>
            {displayConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>

        <p className="text-muted mb-3">
          Connect your <strong>TP-210CE (2x20 VFD Pole Display)</strong> via USB Virtual COM port directly through Google Chrome or Microsoft Edge Web Serial API.
        </p>

        {!isSerialSupported() && (
          <div className="alert alert-warning">
            ⚠️ <strong>Web Serial API not supported!</strong> Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> to use the Customer Display.
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button
            className={`btn ${displayConnected ? "btn-danger" : "btn-success"}`}
            onClick={async () => {
              if (displayConnected) {
                await disconnectCustomerDisplay();
                toast.info("Customer Display disconnected");
              } else {
                try {
                  await connectCustomerDisplay();
                  toast.success("✅ VFD Customer Display connected!");
                } catch (err) {
                  if (err.name !== "NotFoundError") {
                    toast.error("Failed to connect display: " + err.message);
                  }
                }
              }
            }}
            disabled={!isSerialSupported()}
          >
            {displayConnected ? "🔌 Disconnect Display" : "⚡ Connect / Select COM Port"}
          </button>

          {displayConnected && (
            <>
              <button
                className="btn btn-outline-success"
                onClick={async () => {
                  await showWelcomeMessage("Swetha Cafe & Restaurant", "Have a Nice Day!");
                  toast.success("Welcome screen sent to display!");
                }}
              >
                🌟 Test Welcome Screen
              </button>

              <button
                className="btn btn-outline-info"
                onClick={async () => {
                  await showItemDisplay("Roasted Chicken", 1, 1800, "Rs.");
                  toast.success("Sample item sent to display!");
                }}
              >
                🛒 Test Item (Rs. 1,800.00)
              </button>

              <button
                className="btn btn-outline-primary"
                onClick={async () => {
                  await showTotalDisplay(3500, "Rs.");
                  toast.success("Sample total sent to display!");
                }}
              >
                💰 Test Total (Rs. 3,500.00)
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={async () => {
                  await clearCustomerDisplay();
                  toast.info("Display cleared");
                }}
              >
                🧹 Clear Screen
              </button>
            </>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default PrinterSettings;