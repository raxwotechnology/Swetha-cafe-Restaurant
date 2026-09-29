// src/utils/printReceipt.js
import { toast } from "react-toastify";
import axios from "axios";
import API_BASE_URL from "../api.js";

/**
 * Combines multiple full HTML documents (e.g. Customer Bill + Token Slip)
 * into a SINGLE valid HTML document with proper print page breaks.
 */
export const combinePrintableHTML = (htmlPages = []) => {
  const validPages = htmlPages.filter(Boolean);
  if (validPages.length === 0) return "";
  if (validPages.length === 1) return validPages[0];

  const bodyContents = validPages.map((pageHtml) => {
    // Extract inner content of <body> if full HTML, else use as-is
    const bodyMatch = pageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : pageHtml;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipts & Tokens</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .slip-page {
              page-break-after: always !important;
              break-after: page !important;
            }
            .slip-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
          body {
            font-family: 'Poppins', sans-serif;
            width: 275px;
            margin: 0 auto;
            padding: 0;
            background: #fff;
            color: #000;
            line-height: 1.35;
          }
          .slip-page {
            width: 275px;
            box-sizing: border-box;
            padding: 8px;
            margin: 0 auto 24px auto;
            background: #fff;
          }
          .slip-page:last-child {
            margin-bottom: 0;
          }
          hr {
            border: 0;
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .token-box {
            text-align: center;
            font-size: 26px;
            font-weight: 900;
            margin: 6px 0;
            border: 2px solid #000;
            padding: 6px 0;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        ${bodyContents.map((content) => `<div class="slip-page">${content}</div>`).join('')}
      </body>
    </html>
  `;
};

/**
 * Helper to get QZ Tray print data for an HTML string
 */
const getPrintData = (html) => [{
  type: 'pixel',     // Required for HTML
  format: 'html',    // Format is "html"
  flavor: 'plain',
  data: html
}];

let isBrowserPrinting = false;
let lastBrowserPrintTime = 0;

// Mutex set to track active print jobs and prevent concurrent duplicate prints
const activePrintingJobs = new Set();

const extractOrderKeyFromHTML = (html) => {
  if (!html) return null;
  const match = html.match(/(?:INV-[\w-]+|Daily Token #\d+|Order #[\w-]+)/i);
  return match ? match[0].trim() : null;
};

/**
 * Reset all module-level print state.
 * Call this on logout so the next login session starts fresh
 * and does NOT produce duplicate prints.
 */
export const resetPrintState = () => {
  isBrowserPrinting = false;
  lastBrowserPrintTime = 0;
  cachedPrinters = null;
  lastPrintersFetch = 0;
  activePrintingJobs.clear();
  try { localStorage.removeItem("cached_printers"); } catch (e) {}
};

/**
 * Print HTML directly using a temporary hidden iframe for clean browser printing
 */
export const printHTMLViaBrowser = (html) => {
  if (!html) return;
  const now = Date.now();
  if (isBrowserPrinting || (now - lastBrowserPrintTime < 1500)) {
    console.warn("Print already in progress or debounced, skipping duplicate print");
    return;
  }
  isBrowserPrinting = true;
  lastBrowserPrintTime = now;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Iframe print error:", e);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        isBrowserPrinting = false;
      }, 1500);
    }, 250);
  } catch (err) {
    console.warn("Browser iframe print failed, falling back to window.print:", err);
    window.print();
    isBrowserPrinting = false;
  }
};

/**
 * Cache for saved printers to avoid network latency on every print
 */
let cachedPrinters = null;
let lastPrintersFetch = 0;
const PRINTER_CACHE_TTL = 60 * 1000; // 1 minute cache

const getSavedPrinters = async (token) => {
  if (cachedPrinters && (Date.now() - lastPrintersFetch < PRINTER_CACHE_TTL)) {
    return cachedPrinters;
  }
  try {
    const cached = localStorage.getItem("cached_printers");
    if (cached && !cachedPrinters) {
      cachedPrinters = JSON.parse(cached);
    }
  } catch (e) {}

  if (token) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/printers`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2000 // 2s timeout max
      });
      cachedPrinters = res.data || [];
      lastPrintersFetch = Date.now();
      try {
        localStorage.setItem("cached_printers", JSON.stringify(cachedPrinters));
      } catch (e) {}
      return cachedPrinters;
    } catch (err) {
      console.warn("Failed to load saved printers, using cache:", err.message);
    }
  }
  return cachedPrinters || [];
};

let qzConnectPromise = null;

/**
 * Fast QZ Tray connection check with 3.5s timeout.
 * Reuses in-flight promise and can be called early to pre-warm the WebSocket.
 */
export const connectQZTrayFast = (timeoutMs = 3500) => {
  if (typeof qz === "undefined") return Promise.reject(new Error("QZ Tray not installed"));
  if (qz.websocket && qz.websocket.isActive && qz.websocket.isActive()) {
    return Promise.resolve();
  }
  if (qzConnectPromise) {
    return qzConnectPromise;
  }
  qzConnectPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      qzConnectPromise = null;
      reject(new Error(`QZ Tray connection timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    qz.websocket.connect({ retries: 0, delay: 0 })
      .then(() => {
        clearTimeout(timeout);
        qzConnectPromise = null;
        resolve();
      })
      .catch((err) => {
        clearTimeout(timeout);
        qzConnectPromise = null;
        reject(err);
      });
  });
  return qzConnectPromise;
};

/**
 * Prints Customer Receipt, Customer Token Slip, and/or Kitchen KOT to appropriate saved printers.
 * @param {string} customerHTML - Full receipt HTML for cashier / customer
 * @param {string} kitchenHTML - KOT HTML with Token #, items & quantities only (NO prices)
 * @param {string} targetRole - "all" | "cashier" | "kitchen" | "token"
 * @param {string} tokenSlipHTML - Standalone customer token / order number slip
 * @param {string|null} orderKey - Optional unique order identifier to prevent duplicate concurrent prints
 */
export const printReceiptToBoth = async (customerHTML, kitchenHTML, targetRole = "all", tokenSlipHTML = null, orderKey = null) => {
  const lockKey = orderKey || extractOrderKeyFromHTML(customerHTML) || extractOrderKeyFromHTML(tokenSlipHTML);
  const mutexKey = lockKey ? `${lockKey}:${targetRole}` : null;

  if (mutexKey) {
    if (activePrintingJobs.has(mutexKey)) {
      console.warn(`[printReceipt] Duplicate print prevented for ${mutexKey}`);
      return;
    }
    activePrintingJobs.add(mutexKey);
    // Lock for 8 seconds to prevent fast duplicate triggers
    setTimeout(() => {
      activePrintingJobs.delete(mutexKey);
    }, 8000);
  }

  let token;
  try {
    token = localStorage.getItem("token");
  } catch (err) {}

  const rawSavedPrinters = await getSavedPrinters(token);

  // Deduplicate saved printers by name only — the same physical printer
  // must never print the same job twice even if it was registered under
  // multiple roles (e.g. both "" and "cashier").
  const uniquePrintersMap = new Map();
  (rawSavedPrinters || []).forEach((p) => {
    const pName = (p.name || "").trim();
    if (!pName) return;
    const pRole = (p.role || "").toLowerCase();
    const key = pName.toLowerCase(); // name-only key prevents duplicate physical printers
    if (!uniquePrintersMap.has(key)) {
      uniquePrintersMap.set(key, { ...p, name: pName, role: pRole });
    }
  });
  const savedPrinters = Array.from(uniquePrintersMap.values());


  // Attempt QZ Tray print if available & printers are configured
  let printedViaQZ = false;
  if (typeof qz !== "undefined" && savedPrinters.length > 0) {
    try {
      await connectQZTrayFast(3500);

      for (const printer of savedPrinters) {
        const printerName = printer.name;
        if (!printerName) continue;

        const role = printer.role || "";
        const isKitchen = role === "kitchen" || 
          (role === "" && (printerName.toLowerCase().includes("kitchen") || printerName.toLowerCase().includes("kot")));

        if ((targetRole === "cashier" || targetRole === "token") && isKitchen) continue;
        if (targetRole === "kitchen" && !isKitchen) continue;

        try {
          if (!isKitchen) {
            // Cashier Printer: Print Customer Bill FIRST, then Token Slip SEPARATELY
            if (targetRole === "all" || targetRole === "cashier") {
              if (customerHTML) {
                const config = qz.configs.create(printerName, { rasterize: true, margins: 0, scaleContent: true });
                await qz.print(config, getPrintData(customerHTML));
                printedViaQZ = true;
                const toastKey = `print-${printerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-cashier`;
                toast.success(`✅ Printed Bill to ${printerName}`, { toastId: toastKey });
              }
              // Print Token Slip as a SEPARATE job after a short delay
              if (tokenSlipHTML) {
                await new Promise(resolve => setTimeout(resolve, 600));
                const tokenConfig = qz.configs.create(printerName, { rasterize: true, margins: 0, scaleContent: true });
                await qz.print(tokenConfig, getPrintData(tokenSlipHTML));
                const tokenToastKey = `print-${printerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-token`;
                toast.success(`✅ Printed Token to ${printerName}`, { toastId: tokenToastKey });
              }
            } else if (targetRole === "token" && tokenSlipHTML) {
              const config = qz.configs.create(printerName, { rasterize: true, margins: 0, scaleContent: true });
              await qz.print(config, getPrintData(tokenSlipHTML));
              printedViaQZ = true;
              const toastKey = `print-${printerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-token`;
              toast.success(`✅ Printed Token to ${printerName}`, { toastId: tokenToastKey });
            }
          } else {
            // Kitchen Printer: Print KOT
            if (targetRole === "all" || targetRole === "kitchen") {
              const htmlToPrint = kitchenHTML || customerHTML;
              if (htmlToPrint) {
                const config = qz.configs.create(printerName, { rasterize: true, margins: 0, scaleContent: true });
                await qz.print(config, getPrintData(htmlToPrint));
                printedViaQZ = true;
                const toastKey = `print-${printerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-kitchen`;
                toast.success(`✅ Printed to ${printerName}`, { toastId: toastKey });
              }
            }
          }
        } catch (err) {
          console.error(`Print failed for ${printerName}:`, err);
        }
      }
    } catch (err) {
      // QZ Tray not running or not responsive — proceed immediately to browser print without delay
      console.info("QZ Tray not active, using fast browser print fallback");
    }
  }

  // If not printed via QZ Tray, trigger browser print with separate jobs
  if (!printedViaQZ) {
    if (targetRole === "kitchen") {
      const fallbackHTML = kitchenHTML || customerHTML;
      if (fallbackHTML) printHTMLViaBrowser(fallbackHTML);
    } else if (targetRole === "token") {
      if (tokenSlipHTML) printHTMLViaBrowser(tokenSlipHTML);
    } else if (targetRole === "cashier" || targetRole === "all") {
      // Print Bill first
      if (customerHTML) {
        printHTMLViaBrowser(customerHTML);
      }
      // Print Token Slip separately after browser print dialog closes (estimated ~2s)
      if (tokenSlipHTML) {
        setTimeout(() => {
          printHTMLViaBrowser(tokenSlipHTML);
        }, 2000);
      }
    }
  }
};

/**
 * Shortcut to print Customer Receipt (+ optional Token Slip)
 */
export const printCustomerReceipt = async (customerHTML, tokenSlipHTML = null, orderKey = null) => {
  return printReceiptToBoth(customerHTML, null, "cashier", tokenSlipHTML, orderKey);
};

/**
 * Shortcut to print ONLY Customer Token Slip
 */
export const printCustomerTokenSlip = async (tokenSlipHTML, orderKey = null) => {
  return printReceiptToBoth(null, null, "token", tokenSlipHTML, orderKey);
};

/**
 * Shortcut to print ONLY Kitchen KOT
 */
export const printKitchenKOT = async (kitchenHTML, orderKey = null) => {
  return printReceiptToBoth(null, kitchenHTML, "kitchen", null, orderKey);
};