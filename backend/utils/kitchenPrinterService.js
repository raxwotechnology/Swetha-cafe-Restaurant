// backend/utils/kitchenPrinterService.js
const net = require("net");
const Printer = require("../models/Printer");

/**
 * Formats order data into ESC/POS thermal text commands for Kitchen Order Ticket (KOT).
 */
function buildKOTText(order) {
  const init = "\x1B\x40";           // Initialize printer
  const alignCenter = "\x1B\x61\x01"; // Center align
  const alignLeft = "\x1B\x61\x00";   // Left align
  const boldOn = "\x1B\x45\x01";       // Emphasized mode on
  const boldOff = "\x1B\x45\x00";      // Emphasized mode off
  const doubleSize = "\x1D\x21\x11";   // Double height + width
  const normalSize = "\x1D\x21\x00";   // Normal size
  const cutPaper = "\x1D\x56\x01";     // ESC/POS Paper cut

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    : new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

  const dailyNo = order.dailyOrderNo || (order.orderId ? order.orderId.split('-').pop() : '1');
  let text = "";
  text += init;
  text += alignCenter;
  text += boldOn + doubleSize + `KOT TOKEN #: #${dailyNo}\n` + normalSize + boldOff;
  text += "================================\n";
  text += alignLeft;
  text += `INVOICE: ${order.orderId || order._id}\n`;
  text += `TYPE   : ${order.orderType || "Dine-in"}\n`;
  if (order.tableNumber) {
    text += `TABLE  : ${order.tableNumber}\n`;
  }
  text += `DATE   : ${dateStr}\n`;
  text += "--------------------------------\n";
  text += boldOn + "QTY  ITEM NAME\n" + boldOff;
  text += "--------------------------------\n";

  if (Array.isArray(order.items)) {
    order.items.forEach(item => {
      const name = item.name || item.menuItem?.name || "Item";
      const qty = item.quantity || item.qty || 1;
      text += `${String(qty).padStart(2)} x ${name}\n`;
      if (item.specialNotes) {
        text += `     Note: ${item.specialNotes}\n`;
      }
    });
  }

  const orderNote = order.notes || order.deliveryNote || "";
  if (orderNote && orderNote.trim()) {
    text += "--------------------------------\n";
    text += boldOn + `NOTE: ${orderNote.trim()}\n` + boldOff;
  }

  text += "================================\n\n\n\n\n";
  text += cutPaper;

  return Buffer.from(text, "utf8");
}

/**
 * Sends order KOT directly to Wi-Fi printer IP address via TCP socket.
 */
async function sendToWifiPrinter(printerConfig, orderData) {
  const { ipAddress, port = 9100, name = "Kitchen Printer" } = printerConfig;

  if (!ipAddress || !ipAddress.trim()) {
    console.warn(`[KOT Print] Printer "${name}" has no IP address configured.`);
    return false;
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const targetPort = parseInt(port, 10) || 9100;
    const targetHost = ipAddress.trim();

    socket.setTimeout(2500); // 2.5 sec timeout max

    socket.connect(targetPort, targetHost, () => {
      console.log(`[KOT Print] Connected to Wi-Fi Printer "${name}" at ${targetHost}:${targetPort}`);
      const rawPayload = buildKOTText(orderData);
      socket.write(rawPayload, (err) => {
        if (err) {
          console.error(`[KOT Print Error] Failed writing data to ${targetHost}:${targetPort}:`, err);
          socket.destroy();
          resolve(false);
        } else {
          console.log(`[KOT Print] Successfully printed KOT for Order #${orderData.orderId || orderData._id}`);
          setTimeout(() => {
            socket.end();
            resolve(true);
          }, 500);
        }
      });
    });

    socket.on("timeout", () => {
      console.error(`[KOT Print Error] Timeout connecting to Wi-Fi Printer at ${targetHost}:${targetPort}`);
      socket.destroy();
      resolve(false);
    });

    socket.on("error", (err) => {
      console.error(`[KOT Print Error] Failed to connect to ${targetHost}:${targetPort}: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Trigger automatic KOT print to all configured kitchen Wi-Fi printers when an order is created.
 */
async function printKOTForOrder(orderData) {
  try {
    const kitchenPrinters = await Printer.find({
      role: /kitchen/i,
      ipAddress: { $exists: true, $ne: "" }
    });

    if (!kitchenPrinters || kitchenPrinters.length === 0) {
      console.log("[KOT Print] No Wi-Fi kitchen printer configured.");
      return;
    }

    for (const printer of kitchenPrinters) {
      await sendToWifiPrinter(printer, orderData);
    }
  } catch (err) {
    console.error("[KOT Print Exception]:", err.message);
  }
}

module.exports = {
  buildKOTText,
  sendToWifiPrinter,
  printKOTForOrder
};
