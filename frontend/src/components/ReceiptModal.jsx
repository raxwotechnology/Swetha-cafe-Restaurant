import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { printReceiptToBoth, printCustomerReceipt, printCustomerTokenSlip, printKitchenKOT } from "../utils/printReceipt";
import LogoImage from "../upload/logo.png";
import API_BASE_URL from "../api.js";

// Global set to track auto-printed order IDs across re-renders
const autoPrintedOrders = new Set();

/** Call on logout so the first order after re-login auto-prints correctly */
export const clearAutoPrintedOrders = () => autoPrintedOrders.clear();


const ReceiptModal = ({ order, onClose }) => {
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "Swetha Cafe & Restaurant",
    address: "337C, Galle Road, Mt. Lavinia",
    phone: "0769 886 887",
    email: "aandafoods2026@gmail.com",
    logo: ""
  });
  const [activeTab, setActiveTab] = useState("bill"); // "bill" | "token" | "kot"
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setRestaurantDetails({
            name: res.data.name || "Swetha Cafe & Restaurant",
            address: res.data.address || "337C, Galle Road, Mt. Lavinia",
            phone: res.data.phone || "0769 886 887",
            email: res.data.email || "aandafoods2026@gmail.com",
            logo: res.data.logo || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch restaurant settings in modal:", err);
      }
    };
    fetchRestaurantSettings();
  }, []);

  const printedOrderIdRef = React.useRef(null);

  // Auto-print Customer Receipt, Customer Token Slip & Kitchen KOT once when modal opens
  useEffect(() => {
    if (!order) return;
    const orderKey = String(order._id || order.invoiceNo || JSON.stringify(order.items));
    
    // Prevent duplicate auto-prints
    if (printedOrderIdRef.current === orderKey || autoPrintedOrders.has(orderKey)) {
      return;
    }

    // Set locks immediately
    printedOrderIdRef.current = orderKey;
    autoPrintedOrders.add(orderKey);

    const timer = setTimeout(() => {
      try {
        const fullHTML = generatePrintableHTML();
        const tokenSlipHTML = generateTokenSlipHTML();
        const kitchenHTML = generateKitchenHTML();
        printReceiptToBoth(fullHTML, kitchenHTML, "all", tokenSlipHTML, orderKey);
      } catch (err) {
        console.error("Auto print error:", err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [order]);

  if (!order) return null;

  const orderKey = String(order._id || order.invoiceNo || "");
  const symbol = localStorage.getItem("currencySymbol") || "Rs.";

  const {
    customerName,
    customerPhone,
    tableNo,
    items = [],
    totalPrice
  } = order;

  const getAbsoluteLogo = (logo) => {
    if (!logo || typeof logo !== "string") return "";
    if (logo.startsWith("data:") || logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }
    return window.location.origin + (logo.startsWith("/") ? logo : "/" + logo);
  };

  const logoSrc = restaurantDetails.logo ? (getAbsoluteLogo(restaurantDetails.logo) || restaurantDetails.logo) : "";
  const now = new Date().toLocaleString();
  const dailyNo = order.dailyOrderNo != null ? order.dailyOrderNo : (order.invoiceNo ? order.invoiceNo.split('-').pop() : '1');
  const orderTypeStr = tableNo > 0 ? `Dine In - Table ${tableNo}` : `Takeaway${order.deliveryType ? ` (${order.deliveryType})` : ''}`;

  const getOrderNote = (ord) => {
    if (!ord) return "";
    const parts = [];
    if (ord.deliveryNote && typeof ord.deliveryNote === "string" && ord.deliveryNote.trim()) {
      parts.push(ord.deliveryNote.trim());
    }
    if (ord.payment?.notes && typeof ord.payment.notes === "string" && ord.payment.notes.trim()) {
      const pNote = ord.payment.notes.trim();
      if (!parts.includes(pNote)) {
        parts.push(pNote);
      }
    }
    if (ord.notes && typeof ord.notes === "string" && ord.notes.trim()) {
      const oNote = ord.notes.trim();
      if (!parts.includes(oNote)) {
        parts.push(oNote);
      }
    }
    return parts.join(" | ");
  };

  // 🧾 1. CUSTOMER BILL TEMPLATE (Full with prices, charges, total)
  const generatePrintableHTML = () => {
    const itemsRows = items.map((item, idx) => `
      <tr key="${idx}">
        <td style="padding:4px 0;width:50%;text-align:left;">${item.name}</td>
        <td style="padding:4px 0;width:20%;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 0;width:30%;text-align:right;">${symbol}${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    let serviceChargeRow = '';
    if (order.serviceCharge > 0) {
      const pct = order.subtotal ? ((order.serviceCharge * 100) / order.subtotal).toFixed(2) : '0.00';
      serviceChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Service Charge (${pct}%)</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.serviceCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    let deliveryChargeRow = '';
    if (order.deliveryCharge > 0) {
      deliveryChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Delivery Charge</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.deliveryCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    const orderNote = getOrderNote(order);
    const noteSection = orderNote ? `
      <div style="margin-top:6px; border-top:1px dashed #000; padding-top:4px;">
        <p style="margin:2px 0; font-size:13px;"><strong>Note:</strong> ${orderNote}</p>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Customer Receipt</title>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              width: 275px;
              margin: 0;
              padding: 7.5px;
              background: #fff;
              color: #000;
              line-height: 1.4;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0 16px;
            }
            th, td {
              padding: 4px 0;
            }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .mb-1 { margin-bottom: 4px; }
            h3, h4, h5 { margin: 6px 0; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
        <div class="text-center mb-2">
          ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="max-width:180px; max-height:80px; width:auto; height:auto; object-fit:contain; display:inline-block;" />` : ''}
        </div>
        
        <h3 class="text-center" style="font-size:20px; font-weight:bold; margin:6px 0;">${restaurantDetails.name}</h3>
        <p class="text-center" style="font-size:12px; margin:4px 0;">${restaurantDetails.address}</p>
        <p class="text-center" style="font-size:14px; font-weight:bold; margin:4px 0;">${restaurantDetails.phone}</p>
        ${restaurantDetails.email ? `<p class="text-center" style="font-size:12px; margin:2px 0 10px 0;">${restaurantDetails.email}</p>` : ''}
        
        <hr />

        <div class="text-center" style="font-size:18px; font-weight:bold; margin:6px 0; border:1px dashed #000; padding:4px 0;">
          DAILY TOKEN #: #${dailyNo}
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0;">
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Invoice No:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.invoiceNo || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Date:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${now}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Customer:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerName || 'Walk-in'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Phone:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerPhone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Order Type:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top; white-space:nowrap;">${orderTypeStr}</td>
          </tr>
          ${order.tableNo === "Takeaway" && order.deliveryType === "Delivery Service" ? `
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Delivery Place:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.deliveryPlaceName || 'N/A'}</td>
          </tr>` : ''}
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0 16px 0;">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #000; padding:4px 0;">Items</th>
              <th style="text-align:center; border-bottom:1px solid #000; padding:4px 0;">Qty</th>
              <th style="text-align:right; border-bottom:1px solid #000; padding:4px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            ${serviceChargeRow}
            ${deliveryChargeRow}
          </tbody>
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:4px;">
          <tr style="font-size:15px; font-weight:bold;">
            <td style="text-align:left; padding:4px 0;">Total:</td>
            <td style="text-align:right; padding:4px 0;">${symbol}${(order.totalPrice || 0).toFixed(2)}</td>
          </tr>
          ${order.payment?.cash > 0 ? `
          <tr>
            <td style="text-align:left; padding:2px 0; color:#333;">Cash Paid:</td>
            <td style="text-align:right; padding:2px 0;">${symbol}${(order.payment.cash || 0).toFixed(2)}</td>
          </tr>` : ''}
          ${order.payment?.card > 0 ? `
          <tr>
            <td style="text-align:left; padding:2px 0; color:#333;">Card Payment ${order.payment.cardLast4 ? `(**** ${order.payment.cardLast4})` : ''}:</td>
            <td style="text-align:right; padding:2px 0;">${symbol}${(order.payment.card || 0).toFixed(2)}</td>
          </tr>` : ''}
          ${order.payment?.bankTransfer > 0 ? `
          <tr>
            <td style="text-align:left; padding:2px 0; color:#333;">Bank Transfer:</td>
            <td style="text-align:right; padding:2px 0;">${symbol}${(order.payment.bankTransfer || 0).toFixed(2)}</td>
          </tr>` : ''}
          ${order.payment ? `
          <tr style="border-top:1px dashed #666;">
            <td style="text-align:left; font-weight:bold; padding:3px 0;">Total Paid:</td>
            <td style="text-align:right; font-weight:bold; padding:3px 0;">${symbol}${((order.payment.totalPaid != null ? order.payment.totalPaid : (order.totalPrice || 0))).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align:left; font-weight:bold; padding:3px 0; font-size:15px;">Balance / Change:</td>
            <td style="text-align:right; font-weight:bold; padding:3px 0; font-size:15px;">${symbol}${((order.payment.changeDue != null ? Math.max(0, order.payment.changeDue) : 0)).toFixed(2)}</td>
          </tr>` : ''}
        </table>

        <hr />
        ${noteSection}
        <p class="text-center" style="font-size:15px; font-weight:bold; margin:8px 0 4px 0;">Thank you for your order!</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Software By: Raxwo (Pvt) Ltd.</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Contact: 074 357 3333</p>
        <hr />
        </body>
      </html>
    `;
  };

  // 🍳 2. KITCHEN ORDER TICKET (KOT) TEMPLATE (Items & Qty & Order No ONLY - NO PRICES)
  const generateKitchenHTML = () => {
    const kotItemRows = items.map((item) => `
      <tr style="border-bottom: 1px dashed #666;">
        <td style="padding:6px 2px; width:25%; text-align:center; font-size:20px; font-weight:900; vertical-align:middle;">
          ${item.quantity} x
        </td>
        <td style="padding:6px 4px; width:75%; text-align:left; font-size:16px; font-weight:bold; vertical-align:middle;">
          ${item.name}
          ${item.specialNotes ? `<div style="font-size:12px; font-weight:normal; color:#444;">Note: ${item.specialNotes}</div>` : ''}
        </td>
      </tr>
    `).join('');

    const orderNote = getOrderNote(order);
    const kotNoteSection = orderNote ? `
      <div style="margin-top:8px; border-top:1px dashed #000; padding-top:4px; font-size:13px;">
        <strong>Note:</strong> ${orderNote}
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Kitchen Order Ticket</title>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              width: 275px;
              margin: 0;
              padding: 6px;
              background: #fff;
              color: #000;
              line-height: 1.3;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 2px dashed #000;
              margin: 6px 0;
            }
            .text-center { text-align: center; }
            .token-box {
              text-align: center;
              font-size: 24px;
              font-weight: 900;
              margin: 6px 0;
              border: 2px solid #000;
              padding: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="font-size:15px; font-weight:bold; letter-spacing:1px;">*** KITCHEN ORDER (KOT) ***</div>
          
          <div class="token-box">
            TOKEN #: #${dailyNo}
          </div>

          <table style="font-size:13px; margin:4px 0;">
            <tr>
              <td style="font-weight:bold; width:80px;">Invoice:</td>
              <td>${order.invoiceNo || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Type:</td>
              <td style="font-weight:bold; font-size:14px;">${orderTypeStr}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Time:</td>
              <td>${now}</td>
            </tr>
          </table>

          <hr />

          <table>
            <thead>
              <tr style="border-bottom: 2px solid #000;">
                <th style="text-align:center; padding:4px 0; width:25%; font-size:14px;">QTY</th>
                <th style="text-align:left; padding:4px 0; width:75%; font-size:14px;">ITEM NAME</th>
              </tr>
            </thead>
            <tbody>
              ${kotItemRows}
            </tbody>
          </table>

          <hr />
          ${kotNoteSection}
          <div class="text-center" style="font-weight:bold; font-size:13px; margin-top:8px;">*** END OF KOT ***</div>
        </body>
      </html>
    `;
  };

  // 🎟️ 3. CUSTOMER TOKEN / ORDER SLIP TEMPLATE (Token #, Invoice #, Date/Time, Order Type ONLY)
  const generateTokenSlipHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Customer Order Token</title>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              width: 275px;
              margin: 0;
              padding: 8px;
              background: #fff;
              color: #000;
              line-height: 1.4;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .text-center { text-align: center; }
            .token-box {
              text-align: center;
              font-size: 28px;
              font-weight: 900;
              margin: 8px 0;
              border: 2px solid #000;
              padding: 8px 0;
              letter-spacing: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          <div class="text-center mb-2">
            ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="max-width:180px; max-height:80px; width:auto; height:auto; object-fit:contain; display:inline-block;" />` : ''}
          </div>
          
          <h3 class="text-center" style="font-size:18px; font-weight:bold; margin:4px 0;">${restaurantDetails.name}</h3>
          <p class="text-center" style="font-size:12px; margin:2px 0;">${restaurantDetails.address}</p>
          <p class="text-center" style="font-size:13px; font-weight:bold; margin:2px 0;">${restaurantDetails.phone}</p>
          
          <hr />

          <div class="text-center" style="font-size:14px; font-weight:bold; letter-spacing:1px; margin-top:4px;">*** CUSTOMER ORDER TOKEN ***</div>

          <div class="token-box">
            TOKEN #: #${dailyNo}
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:13px; margin:6px 0;">
            <tr>
              <td style="width:90px; font-weight:bold; padding:2px 0; text-align:left;">Invoice No:</td>
              <td style="padding:2px 0; text-align:left;">${order.invoiceNo || 'N/A'}</td>
            </tr>
            <tr>
              <td style="width:90px; font-weight:bold; padding:2px 0; text-align:left;">Date & Time:</td>
              <td style="padding:2px 0; text-align:left;">${now}</td>
            </tr>
            <tr>
              <td style="width:90px; font-weight:bold; padding:2px 0; text-align:left;">Order Type:</td>
              <td style="padding:2px 0; text-align:left; font-weight:bold;">${orderTypeStr}</td>
            </tr>
            <tr>
              <td style="width:90px; font-weight:bold; padding:2px 0; text-align:left;">Customer:</td>
              <td style="padding:2px 0; text-align:left;">${customerName || 'Walk-in'}</td>
            </tr>
            ${customerPhone ? `
            <tr>
              <td style="width:90px; font-weight:bold; padding:2px 0; text-align:left;">Phone:</td>
              <td style="padding:2px 0; text-align:left;">${customerPhone}</td>
            </tr>` : ''}
          </table>

          <hr />

          <p class="text-center" style="font-size:14px; font-weight:bold; margin:8px 0 4px 0;">Please keep this slip to collect your order.</p>
          <p class="text-center" style="font-size:13px; margin:2px 0;">Thank you for dining with us!</p>
          <p class="text-center" style="font-size:11px; margin:4px 0; color:#555;">Software By: Raxwo (Pvt) Ltd.</p>
          <hr />
        </body>
      </html>
    `;
  };

  const exportToPDF = () => {
    const input = document.getElementById("receipt-content");
    if (!input) {
      alert("Receipt not found");
      return;
    }

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      const prefix = activeTab === "kot" ? "kitchen_kot" : (activeTab === "token" ? "customer_token" : "customer_bill");
      pdf.save(`${prefix}_#${dailyNo}.pdf`);
    });
  };

  return (
    <div
      className="receipt-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "24px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Control Buttons Bar */}
      <div className="text-center mb-3 d-print-none bg-white p-3 rounded shadow-sm" style={{ maxWidth: "560px", width: "100%" }}>
        {/* Tab Switcher */}
        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn fw-bold ${activeTab === "bill" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("bill")}
          >
            🧾 Customer Bill
          </button>
          <button
            type="button"
            className={`btn fw-bold ${activeTab === "token" ? "btn-info text-white" : "btn-outline-info text-dark"}`}
            onClick={() => setActiveTab("token")}
          >
            🎟️ Customer Token
          </button>
          <button
            type="button"
            className={`btn fw-bold ${activeTab === "kot" ? "btn-warning" : "btn-outline-warning text-dark"}`}
            onClick={() => setActiveTab("kot")}
          >
            🍳 Kitchen KOT
          </button>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <button onClick={onClose} className="btn btn-secondary btn-sm px-3">
            ❌ Close
          </button>
          <button onClick={exportToPDF} className="btn btn-outline-dark btn-sm px-3">
            📄 PDF
          </button>
          <button
            className="btn btn-success btn-sm px-3 fw-bold"
            disabled={isPrinting}
            onClick={() => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                const fullHTML = generatePrintableHTML();
                const tokenSlipHTML = generateTokenSlipHTML();
                printCustomerReceipt(fullHTML, tokenSlipHTML, `${orderKey}-manual-customer`);
              } finally {
                setTimeout(() => setIsPrinting(false), 2500);
              }
            }}
            title="Print Customer Bill and separate Token Slip"
          >
            🖨️ {isPrinting ? "Printing..." : "Bill + Token"}
          </button>
          <button
            className="btn btn-outline-success btn-sm px-3"
            disabled={isPrinting}
            onClick={() => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                const fullHTML = generatePrintableHTML();
                printCustomerReceipt(fullHTML, null, `${orderKey}-manual-bill`);
              } finally {
                setTimeout(() => setIsPrinting(false), 2500);
              }
            }}
          >
            🧾 Bill Only
          </button>
          <button
            className="btn btn-info text-white btn-sm px-3 fw-bold"
            disabled={isPrinting}
            onClick={() => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                const tokenSlipHTML = generateTokenSlipHTML();
                printCustomerTokenSlip(tokenSlipHTML, `${orderKey}-manual-token`);
              } finally {
                setTimeout(() => setIsPrinting(false), 2500);
              }
            }}
          >
            🎟️ Token Only
          </button>
          <button
            className="btn btn-warning btn-sm px-3 fw-bold text-dark"
            disabled={isPrinting}
            onClick={() => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                const kitchenHTML = generateKitchenHTML();
                printKitchenKOT(kitchenHTML, `${orderKey}-manual-kitchen`);
              } finally {
                setTimeout(() => setIsPrinting(false), 2500);
              }
            }}
          >
            🍳 Kitchen KOT
          </button>
          <button
            className="btn btn-primary btn-sm px-3 fw-bold"
            disabled={isPrinting}
            onClick={() => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                const fullHTML = generatePrintableHTML();
                const tokenSlipHTML = generateTokenSlipHTML();
                const kitchenHTML = generateKitchenHTML();
                printReceiptToBoth(fullHTML, kitchenHTML, "all", tokenSlipHTML, `${orderKey}-manual-all`);
              } finally {
                setTimeout(() => setIsPrinting(false), 2500);
              }
            }}
          >
            📑 {isPrinting ? "Printing..." : "Print All"}
          </button>
        </div>
      </div>

      {/* Dynamic Receipt Content */}
      <div
        id="receipt-content"
        style={{
          maxWidth: "295px",
          width: "100%",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          lineHeight: 1.4,
          fontFamily: "Calibri, sans-serif",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}
      >
        {activeTab === "bill" ? (
          /* =================== CUSTOMER BILL VIEW =================== */
          <>
            <div className="text-center mb-2">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    maxWidth: '180px',
                    maxHeight: '80px',
                    width: 'auto',
                    height: 'auto',
                    display: 'inline-block',
                    objectFit: 'contain'
                  }}
                />
              ) : null}
            </div>
            <h3 className="mb-1 fs-5 text-center"><strong>{restaurantDetails.name}</strong></h3>
            <p className="mb-0 text-center" style={{ fontSize: "13px" }}>{restaurantDetails.address}</p>
            <p className="mb-0 text-center" style={{ fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
            {restaurantDetails.email && (
              <p className="mb-2 text-center" style={{ fontSize: "12px", color: "#666" }}>{restaurantDetails.email}</p>
            )}
            <hr style={{ margin: "8px 0" }}/>

            <div className="text-center fw-bold py-1 mb-2" style={{ fontSize: "17px", border: "1px dashed #000" }}>
              DAILY TOKEN #: #{dailyNo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "6px 0" }}>
              <tbody>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Invoice No:</td>
                  <td style={{ padding: "2px 0" }}>{order.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Date:</td>
                  <td style={{ padding: "2px 0" }}>{now}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Customer:</td>
                  <td style={{ padding: "2px 0" }}>{customerName || 'Walk-in'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Phone:</td>
                  <td style={{ padding: "2px 0" }}>{customerPhone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Order Type:</td>
                  <td style={{ padding: "2px 0", whiteSpace: "nowrap" }}>{orderTypeStr}</td>
                </tr>
                {tableNo === "Takeaway" && order.deliveryType === "Delivery Service" && (
                  <tr>
                    <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Delivery Place:</td>
                    <td style={{ padding: "2px 0" }}>{order.deliveryPlaceName || 'N/A'}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0" }}/>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ padding: "4px 0", width: "50%", textAlign: "left" }}>Items</th>
                  <th style={{ padding: "4px 0", width: "20%", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "4px 0", width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "4px 0", width: "50%", textAlign: "left" }}>{item.name}</td>
                    <td style={{ padding: "4px 0", width: "20%", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "4px 0", width: "30%", textAlign: "right" }}>
                      {symbol}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {order.serviceCharge > 0 && (
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>
                      Service Charge ({((order.serviceCharge * 100) / (order.subtotal || 1)).toFixed(2)}%)
                    </td>
                    <td></td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      {symbol}{order.serviceCharge?.toFixed(2)}
                    </td>
                  </tr>
                )}

                {order.deliveryCharge > 0 && (
                  <tr>
                    <td style={{ padding: "4px 0", textAlign: "left" }}>Delivery Charge</td>
                    <td></td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      {symbol}{order.deliveryCharge?.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0" }}/>
            <h5 className="text-end fs-6 mb-2"><strong>Total: {symbol}{totalPrice?.toFixed(2)}</strong></h5>

            {order.payment && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "4px 0 8px 0" }}>
                <tbody>
                  {order.payment.cash > 0 && (
                    <tr>
                      <td style={{ textAlign: "left", padding: "2px 0", color: "#444" }}>Cash Paid:</td>
                      <td style={{ textAlign: "right", padding: "2px 0" }}>{symbol}{order.payment.cash.toFixed(2)}</td>
                    </tr>
                  )}
                  {order.payment.card > 0 && (
                    <tr>
                      <td style={{ textAlign: "left", padding: "2px 0", color: "#444" }}>
                        Card Payment {order.payment.cardLast4 ? `(**** ${order.payment.cardLast4})` : ''}:
                      </td>
                      <td style={{ textAlign: "right", padding: "2px 0" }}>{symbol}{order.payment.card.toFixed(2)}</td>
                    </tr>
                  )}
                  {order.payment.bankTransfer > 0 && (
                    <tr>
                      <td style={{ textAlign: "left", padding: "2px 0", color: "#444" }}>Bank Transfer:</td>
                      <td style={{ textAlign: "right", padding: "2px 0" }}>{symbol}{order.payment.bankTransfer.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "1px dashed #666", fontWeight: "bold" }}>
                    <td style={{ textAlign: "left", padding: "3px 0" }}>Total Paid:</td>
                    <td style={{ textAlign: "right", padding: "3px 0" }}>
                      {symbol}{(order.payment.totalPaid != null ? order.payment.totalPaid : totalPrice).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ fontWeight: "bold", fontSize: "14px" }} className="text-success">
                    <td style={{ textAlign: "left", padding: "3px 0" }}>Balance (Change):</td>
                    <td style={{ textAlign: "right", padding: "3px 0" }}>
                      {symbol}{(order.payment.changeDue != null ? Math.max(0, order.payment.changeDue) : 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <p className="text-center mb-1 fw-bold" style={{ fontSize: "15px" }}>Thank you for your order!</p>
            <p className="text-center mb-0" style={{ fontSize: "12px", color: "#555" }}>Software By: Raxwo (Pvt) Ltd.</p>
            <p className="text-center mb-1" style={{ fontSize: "12px", color: "#555" }}>Contact: 074 357 3333</p>
            <hr style={{ margin: "8px 0" }}/>

            {getOrderNote(order) && (
              <div style={{ fontSize: "13px", marginTop: "6px" }}>
                <strong>Note:</strong>
                <div>{getOrderNote(order)}</div>
              </div>
            )}
          </>
        ) : activeTab === "token" ? (
          /* =================== CUSTOMER TOKEN VIEW =================== */
          <>
            <div className="text-center mb-2">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    maxWidth: '180px',
                    maxHeight: '80px',
                    width: 'auto',
                    height: 'auto',
                    display: 'inline-block',
                    objectFit: 'contain'
                  }}
                />
              ) : null}
            </div>
            <h3 className="mb-1 fs-5 text-center"><strong>{restaurantDetails.name}</strong></h3>
            <p className="mb-0 text-center" style={{ fontSize: "13px" }}>{restaurantDetails.address}</p>
            <p className="mb-2 text-center" style={{ fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
            
            <hr style={{ margin: "8px 0" }}/>

            <div className="text-center fw-bold mb-1 text-muted" style={{ fontSize: "13px", letterSpacing: "1px" }}>
              *** CUSTOMER ORDER TOKEN ***
            </div>

            <div className="text-center fw-bold py-2 my-2 bg-light text-dark" style={{ fontSize: "28px", border: "2px solid #000" }}>
              TOKEN #: #{dailyNo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "6px 0" }}>
              <tbody>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Invoice No:</td>
                  <td style={{ padding: "2px 0" }}>{order.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Date & Time:</td>
                  <td style={{ padding: "2px 0" }}>{now}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Order Type:</td>
                  <td style={{ padding: "2px 0", fontWeight: "bold", whiteSpace: "nowrap" }}>{orderTypeStr}</td>
                </tr>
                <tr>
                  <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Customer:</td>
                  <td style={{ padding: "2px 0" }}>{customerName || 'Walk-in'}</td>
                </tr>
                {customerPhone && (
                  <tr>
                    <td style={{ width: "90px", fontWeight: "bold", padding: "2px 0" }}>Phone:</td>
                    <td style={{ padding: "2px 0" }}>{customerPhone}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0" }}/>

            <p className="text-center mb-1 fw-bold" style={{ fontSize: "14px" }}>
              Please keep this slip to collect your order.
            </p>
            <p className="text-center mb-1" style={{ fontSize: "13px" }}>
              Thank you for dining with us!
            </p>
            <p className="text-center mb-0" style={{ fontSize: "11px", color: "#555" }}>
              Software By: Raxwo (Pvt) Ltd.
            </p>
            <hr style={{ margin: "8px 0" }}/>
          </>
        ) : (
          /* =================== KITCHEN KOT VIEW =================== */
          <>
            <div className="text-center fw-bold mb-1" style={{ fontSize: "15px", letterSpacing: "1px" }}>
              *** KITCHEN ORDER (KOT) ***
            </div>

            <div className="text-center fw-bold py-2 my-2" style={{ fontSize: "24px", border: "2px solid #000" }}>
              TOKEN #: #{dailyNo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "6px 0" }}>
              <tbody>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Invoice:</td>
                  <td style={{ padding: "2px 0" }}>{order.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Type:</td>
                  <td style={{ padding: "2px 0", fontWeight: "bold", fontSize: "14px" }}>{orderTypeStr}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", fontWeight: "bold", padding: "2px 0" }}>Time:</td>
                  <td style={{ padding: "2px 0" }}>{now}</td>
                </tr>
              </tbody>
            </table>

            <hr style={{ margin: "8px 0", borderTop: "2px dashed #000" }}/>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <th style={{ padding: "4px 0", width: "25%", textAlign: "center", fontSize: "14px" }}>QTY</th>
                  <th style={{ padding: "4px 0", width: "75%", textAlign: "left", fontSize: "14px" }}>ITEM NAME</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px dashed #666" }}>
                    <td style={{ padding: "6px 2px", width: "25%", textAlign: "center", fontSize: "19px", fontWeight: "900", verticalAlign: "middle" }}>
                      {item.quantity} x
                    </td>
                    <td style={{ padding: "6px 4px", width: "75%", textAlign: "left", fontSize: "15px", fontWeight: "bold", verticalAlign: "middle" }}>
                      {item.name}
                      {item.specialNotes && (
                        <div style={{ fontSize: "12px", fontWeight: "normal", color: "#555" }}>
                          Note: {item.specialNotes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ margin: "8px 0", borderTop: "2px dashed #000" }}/>

            {getOrderNote(order) && (
              <div style={{ fontSize: "13px", marginTop: "6px" }}>
                <strong>Note:</strong> {getOrderNote(order)}
              </div>
            )}

            <div className="text-center fw-bold mt-2" style={{ fontSize: "13px" }}>
              *** END OF KOT ***
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
