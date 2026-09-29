// src/utils/customerDisplay.js
/**
 * Web Serial API Controller for TP-210CE VFD Customer Display (2 Lines x 20 Columns)
 * Supports standard ESC/POS commands over USB Virtual COM / Serial Port.
 */

let serialPort = null;
let isConnected = false;
const listeners = new Set();

const notify = (status) => {
  isConnected = status;
  listeners.forEach((callback) => {
    try {
      callback(status);
    } catch (e) {
      console.error("VFD listener error:", e);
    }
  });
};

/**
 * Clean text to standard printable ASCII (32-126) for VFD dot matrix display
 */
const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[^\x20-\x7E]/g, " ").trim();
};

/**
 * Truncate or right-pad text with spaces to exact length (default 20)
 */
const padLine = (text, len = 20) => {
  const clean = cleanText(text);
  if (clean.length > len) return clean.substring(0, len);
  return clean.padEnd(len, " ");
};

/**
 * Center text within exact length (default 20)
 */
const centerLine = (text, len = 20) => {
  const clean = cleanText(text);
  if (clean.length >= len) return clean.substring(0, len);
  const totalSpaces = len - clean.length;
  const leftSpaces = Math.floor(totalSpaces / 2);
  const rightSpaces = totalSpaces - leftSpaces;
  return " ".repeat(leftSpaces) + clean + " ".repeat(rightSpaces);
};

/**
 * Place left on the left side and right on the right side, padded with spaces to exact length
 */
const twoColumnLine = (left, right, len = 20) => {
  const l = cleanText(left);
  const r = cleanText(right);
  if (l.length + r.length >= len) {
    return (l + " " + r).substring(0, len).padEnd(len, " ");
  }
  const spaceCount = len - l.length - r.length;
  return l + " ".repeat(spaceCount) + r;
};

/**
 * Send 2 lines of text to VFD Customer Display using ESC/POS
 */
const clearAndWrite = async (line1, line2) => {
  if (!serialPort || !serialPort.writable) {
    if (isConnected) notify(false);
    return false;
  }

  try {
    const l1 = padLine(line1, 20);
    const l2 = padLine(line2, 20);
    const encoder = new TextEncoder();

    const writer = serialPort.writable.getWriter();

    // 0x0C = Form Feed (Clears screen & sets cursor to row 1, col 1 in ESC/POS VFD)
    // 0x1B 0x40 = ESC @ (Initialize device)
    const initAndClear = new Uint8Array([0x1B, 0x40, 0x0C]);
    await writer.write(initAndClear);

    // Send 40 ASCII characters (20 chars line 1 + 20 chars line 2)
    const textData = encoder.encode(l1 + l2);
    await writer.write(textData);

    writer.releaseLock();
    return true;
  } catch (err) {
    console.error("VFD Customer Display write error:", err);
    if (!serialPort?.writable) {
      notify(false);
    }
    return false;
  }
};

/**
 * Check if Web Serial API is supported in current browser
 */
export const isSerialSupported = () => {
  return typeof navigator !== "undefined" && "serial" in navigator;
};

/**
 * Check if customer display is currently connected and ready
 */
export const isCustomerDisplayConnected = () => {
  return isConnected && serialPort !== null && Boolean(serialPort.writable);
};

/**
 * Connect to VFD Customer Display (Opens browser COM port selection modal)
 */
export const connectCustomerDisplay = async () => {
  if (!isSerialSupported()) {
    throw new Error(
      "Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge."
    );
  }

  try {
    // If already open, close previous
    if (serialPort) {
      try {
        await serialPort.close();
      } catch (e) {
        // ignore
      }
      serialPort = null;
    }

    // Prompt user to select COM port
    const port = await navigator.serial.requestPort();
    await port.open({
      baudRate: 9600, // Standard default for TP-210CE VFD
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      flowControl: "none"
    });

    serialPort = port;
    notify(true);

    serialPort.addEventListener("disconnect", () => {
      console.warn("VFD Customer Display disconnected");
      serialPort = null;
      notify(false);
    });

    // Display welcome message
    await showWelcomeMessage();
    return true;
  } catch (err) {
    console.error("Failed to connect VFD Customer Display:", err);
    notify(false);
    throw err;
  }
};

/**
 * Automatically reconnect to previously authorized VFD Display port
 */
export const autoConnectCustomerDisplay = async () => {
  if (!isSerialSupported()) return false;

  try {
    if (serialPort && serialPort.writable) {
      notify(true);
      return true;
    }

    const ports = await navigator.serial.getPorts();
    if (ports && ports.length > 0) {
      const port = ports[0];
      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none"
      });

      serialPort = port;
      notify(true);

      serialPort.addEventListener("disconnect", () => {
        console.warn("VFD Customer Display disconnected");
        serialPort = null;
        notify(false);
      });

      await showWelcomeMessage();
      return true;
    }
  } catch (err) {
    console.warn("VFD Auto-connect skipped or port already open:", err);
    if (serialPort?.writable) {
      notify(true);
      return true;
    }
  }

  return false;
};

/**
 * Disconnect from VFD Customer Display
 */
export const disconnectCustomerDisplay = async () => {
  try {
    if (serialPort) {
      await clearCustomerDisplay();
      await serialPort.close();
      serialPort = null;
    }
  } catch (err) {
    console.error("Error disconnecting VFD Customer Display:", err);
  } finally {
    notify(false);
  }
};

/**
 * Subscribe to connection status changes
 * @param {Function} callback (isConnected: boolean) => void
 * @returns {Function} unsubscribe function
 */
export const subscribeCustomerDisplayStatus = (callback) => {
  listeners.add(callback);
  callback(isConnected);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * Display: Welcome Screen
 * Line 1: Welcome to A&A
 * Line 2: Have a Nice Day!
 */
export const showWelcomeMessage = async (
  restaurantName = "Swetha Cafe & Restaurant",
  greeting = "Have a Nice Day!"
) => {
  const line1 = centerLine(restaurantName.length > 20 ? "Welcome to Swetha" : restaurantName, 20);
  const line2 = centerLine(greeting, 20);
  return await clearAndWrite(line1, line2);
};

/**
 * Display: Item added / scanned
 * Line 1: 1x Roasted Chicken
 * Line 2: Price:   Rs. 1,800.00
 */
export const showItemDisplay = async (
  itemName,
  quantity = 1,
  price = 0,
  currency = "Rs."
) => {
  const line1 = padLine(`${quantity}x ${cleanText(itemName)}`, 20);
  const formattedPrice = `${currency} ${(Number(price) || 0).toFixed(2)}`;
  const line2 = twoColumnLine("Price:", formattedPrice, 20);
  return await clearAndWrite(line1, line2);
};

/**
 * Display: Bill Total
 * Line 1: Total Amount:
 * Line 2: Amount:  Rs. 3,500.00
 */
export const showTotalDisplay = async (totalAmount = 0, currency = "Rs.") => {
  const line1 = padLine("Total Amount:", 20);
  const formattedTotal = `${currency} ${(Number(totalAmount) || 0).toFixed(2)}`;
  const line2 = twoColumnLine("Amount:", formattedTotal, 20);
  return await clearAndWrite(line1, line2);
};

/**
 * Display: Payment & Change Due
 * Line 1: Total:   Rs. 3,500.00
 * Line 2: Change:  Rs.   500.00
 */
export const showPaymentDisplay = async (
  totalAmount = 0,
  changeDue = 0,
  currency = "Rs."
) => {
  const formattedTotal = `${currency}${(Number(totalAmount) || 0).toFixed(2)}`;
  const formattedChange = `${currency}${(Number(changeDue) || 0).toFixed(2)}`;

  const line1 = twoColumnLine("Total:", formattedTotal, 20);
  const line2 = twoColumnLine("Change:", formattedChange, 20);
  return await clearAndWrite(line1, line2);
};

/**
 * Display: Clear Screen
 */
export const clearCustomerDisplay = async () => {
  return await clearAndWrite("", "");
};

/**
 * Send custom 2-line message
 */
export const showCustomMessage = async (line1 = "", line2 = "") => {
  return await clearAndWrite(line1, line2);
};
