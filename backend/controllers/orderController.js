// backend/controllers/orderController.js

const mongoose = require("mongoose");
const Order = require("../models/Order");
const Driver = require("../models/Driver");
const Employee = require("../models/Employee");
const Menu = require("../models/Menu");
const DeliveryCharge = require("../models/DeliveryChargeByPlace");
const ServiceCharge = require("../models/ServiceCharge");
const Customer = require('../models/Customer'); // adjust path as needed
const InvoiceCounter = require('../models/InvoiceCounter');
const { printKOTForOrder } = require("../utils/kitchenPrinterService");


// POST /api/auth/order
exports.createOrder = async (req, res) => {
  const {
    customerPhone,
    customerName,
    tableNo,
    items,
    deliveryType,
    deliveryPlaceId,
    deliveryNote,
    payment, // { cash, card, bankTransfer, notes }
    waiterId
  } = req.body;

  // const randomPart = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  // const invoiceNo = `INV-${Date.now()}-${randomPart}`;
  // const invoiceNo = `INV-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

  const today = new Date();
  const dateStr = today.getFullYear() + 
                  String(today.getMonth() + 1).padStart(2, '0') + 
                  String(today.getDate()).padStart(2, '0');

  // Atomically increment the counter for today
  const counter = await InvoiceCounter.findOneAndUpdate(
    { date: dateStr },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const sequence = String(counter.seq).padStart(2, '0');
  const invoiceNo = `INV-${dateStr}-${sequence}`; // e.g., "20251208-01"

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items provided" });
  }

  try {
    let waiterName = null; // or "N/A", "", etc.
    
    // Auto-fill customer name from last order
    let finalCustomerName = customerName;
    if (!finalCustomerName && customerPhone) {
      const lastOrder = await Order.findOne({ customerPhone }).sort({ createdAt: -1 });
      finalCustomerName = lastOrder?.customerName || customerName;
    }

    // Upsert customer in Customer collection
    if (customerPhone) {
      await Customer.findOneAndUpdate(
        { phone: customerPhone },
        { 
          phone: customerPhone,
          name: finalCustomerName || undefined, // only update name if provided
          $setOnInsert: { createdAt: new Date() }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );
    }

    // Validate waiterId if provided for a Dine-In order
    let validatedWaiterId = null;
    if (tableNo && tableNo !== "Takeaway" && waiterId) {
      const employee = await Employee.findById(waiterId); // 👈 assumes you have an Employee model
      if (!employee) {
        return res.status(400).json({ error: "Invalid waiter selected" });
      }

      // Adjust field name if your employee role is stored as 'position', 'jobTitle', etc.
      if (employee.role?.toLowerCase() !== "waiter") {
        return res.status(400).json({ error: "Selected employee is not a waiter" });
      }

      validatedWaiterId = waiterId;
      waiterName = employee.name || employee.fullName || "Unknown Waiter"; // 👈 capture name
    }

    // Validate and enrich items
    let validItems = [];
    let subtotal = 0;

    for (let item of items) {
      const menuItem = await Menu.findById(item.menuId);
      if (!menuItem) {
        return res.status(400).json({ error: "Invalid menu item" });
      }

      if (item.quantity > menuItem.currentQty) {
        return res.status(400).json({
          error: `Only ${menuItem.currentQty} left in stock for ${menuItem.name}`
        });
      }

      const netProfitPerUnit = menuItem.price - (menuItem.cost || 0);

      subtotal += menuItem.price * item.quantity;

      validItems.push({
        menuId: menuItem._id,
        name: item.name,
        price: menuItem.price,
        netProfit: netProfitPerUnit,
        imageUrl: (menuItem.imageUrl && !menuItem.imageUrl.startsWith("data:")) ? menuItem.imageUrl : null,
        quantity: item.quantity
      });
    }

    // Apply service charge only for Dine-In
    let serviceCharge = 0;
    let finalTotalPrice = subtotal;

    if (tableNo && tableNo !== "Takeaway") {
      const chargeSettings = await ServiceCharge.findOne({});
      if (chargeSettings?.dineInCharge > 0 && chargeSettings.isActive) {
        serviceCharge = subtotal * (chargeSettings.dineInCharge / 100);
        finalTotalPrice = subtotal + serviceCharge;
      }
    }

    // Apply delivery charge
    // let deliveryCharge = 0;
    // if (tableNo === "Takeaway" && deliveryType === "Delivery Service") {
    //   const deliverySettings = await DeliveryCharge.findOne({});
    //   if (deliverySettings?.isActive) {
    //     deliveryCharge = deliverySettings.amount;
    //     finalTotalPrice = subtotal + deliveryCharge;
    //   }
    // }

    let deliveryCharge = 0;
    let deliveryPlaceName = null;

    if (tableNo === "Takeaway" && deliveryType === "Delivery Service" && deliveryPlaceId) {
      const place = await DeliveryCharge.findById(deliveryPlaceId); // ✅ from your new model
      if (!place) {
        return res.status(400).json({ error: "Invalid delivery place selected" });
      }
      deliveryCharge = place.charge;
      deliveryPlaceName = place.placeName; // ✅ store name for receipt
      finalTotalPrice += deliveryCharge;
    }

    // const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const isTakeaway = tableNo === "Takeaway";
    const finalDeliveryType = isTakeaway ? (deliveryType || "Customer Pickup") : null;
    const finalDeliveryStatus = isTakeaway
      ? (finalDeliveryType === "Customer Pickup" ? "Customer Pending" : "Driver Pending")
      : null;

    const dailyOrderNo = counter.seq;

    const newOrder = new Order({
      invoiceNo,
      dailyOrderNo,
      customerName: finalCustomerName,
      customerPhone,
      tableNo,
      waiterId: validatedWaiterId,
      waiterName: waiterName,
      items: validItems,
      subtotal,
      serviceCharge,
      deliveryType: finalDeliveryType,
      deliveryCharge,        // ✅ computed value
      deliveryPlaceName: isTakeaway ? deliveryPlaceName : null, 
      deliveryNote: deliveryNote || "",
      deliveryStatus: finalDeliveryStatus,
      totalPrice: finalTotalPrice,
      payment: {
        cash: payment?.cash || 0,
        card: payment?.card || 0,
        cardLast4: payment?.cardLast4 || "",
        bankTransfer: payment?.bankTransfer || 0,
        totalPaid: (payment?.cash || 0) + (payment?.card || 0) + (payment?.bankTransfer || 0),
        changeDue:
          (payment?.totalPaid != null ? payment.totalPaid : ((payment?.cash || 0) + (payment?.card || 0) + (payment?.bankTransfer || 0))) - finalTotalPrice,
        notes: payment?.notes || ""
      },
      cashierId: req.user.id,
      status: "Pending"
    });

    await newOrder.save();

    // Auto-print to Kitchen Wi-Fi Printer
    printKOTForOrder({
      _id: newOrder._id,
      orderId: newOrder.invoiceNo,
      dailyOrderNo: newOrder.dailyOrderNo,
      orderType: newOrder.tableNo === "Takeaway" ? `Takeaway (${newOrder.deliveryType || "Pickup"})` : `Dine-in (Table ${newOrder.tableNo})`,
      tableNumber: newOrder.tableNo !== "Takeaway" ? newOrder.tableNo : "",
      createdAt: newOrder.createdAt,
      items: newOrder.items,
      notes: (newOrder.deliveryNote || newOrder.payment?.notes || "").trim()
    }).catch(err => console.error("KOT auto-print error:", err));

    // Update menu stock
    for (let item of validItems) {
      await Menu.findByIdAndUpdate(item.menuId, {
        $inc: { currentQty: -item.quantity }
      });
    }

    res.json(newOrder);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.invoiceNo) {
      // Likely a duplicate submission (e.g., double-click, retry)
      return res.status(409).json({
        error: "This order has already been processed. Please do not submit again."
      });
    }
    if (err.name === "ValidationError") {
      console.error("Order validation failed:", err.message);
      return res.status(400).json({ error: err.message });
    }
    console.error("Order creation failed:", err.message || err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// GET /api/auth/orders/history
exports.getOrderHistory = async (req, res) => {
  const { startDate, endDate, status, orderType, deliveryType, page = 1, limit = 50 } = req.query;
  const query = {};

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // ✅ Handle date range properly
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // ✅ If only one date is provided (e.g., daily report), use full day range
  if (startDate && !endDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999); // ✅ End of the day

    query.createdAt = {
      $gte: start,
      $lte: end
    };
  }

  // ✅ Handle status filter
  if (status) {
    query.status = status;
  }

  // Order Type: "table" = Dine-In, "takeaway" = Takeaway
  if (orderType === "table") {
    query.tableNo = { $ne: "Takeaway" }; // Dine-In has real table numbers
  } else if (orderType === "takeaway") {
    query.tableNo = "Takeaway";
  }

  // Delivery Type (only applies to Takeaway)
  if (deliveryType) {
    query.deliveryType = deliveryType;
  }

  try {
    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .select("-items.imageUrl")
      .populate("cashierId", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Failed to load order history:", err.message);
    res.status(500).json({ error: "Failed to load orders" });
  }
};

// Update order status (used by both admin & kitchen)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        statusUpdatedAt: Date.now()
       },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update status" });
  }
};

exports.exportOrdersToExcel = async (req, res) => {
  const { startDate, endDate, status, orderType, deliveryType } = req.query;
  const query = {};

  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (status) query.status = status;
  if (orderType === "table") query.tableNo = { $ne: "Takeaway" };
  else if (orderType === "takeaway") query.tableNo = "Takeaway";
  if (deliveryType) query.deliveryType = deliveryType;

  try {
    const orders = await Order.find(query).sort({ createdAt: -1 });
    const XLSX = require("xlsx");

    const flatOrders = orders.flatMap(order =>
      order.items.map(i => ({
        OrderID: order.invoiceNo,
        Date: new Date(order.createdAt).toLocaleString(),
        Customer: order.customerName,
        Table: order.tableNo,
        Item: i.name,
        Quantity: i.quantity,
        Price: i.price,
        TotalPrice: i.price * i.quantity,
        Status: order.status
      }))
    );

    const ws = XLSX.utils.json_to_sheet(flatOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    
    // Instead of writing to file on server, we should probably send it as a buffer/stream
    // but the current implementation was writing to disk which is also risky on Render.
    // However, I'll keep the logic similar but fixed for memory where possible.
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error("Export failed:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
};

// backend/controllers/orderController.js

exports.getCustomerByPhone = async (req, res) => {
  const { phone } = req.query;

  if (!phone) return res.json(null);

  try {
    const lastOrder = await Order.findOne({ customerPhone: phone }).sort({ date: -1 });

    if (lastOrder) {
      return res.json({
        name: lastOrder.customerName,
        phone: lastOrder.customerPhone
      });
    }

    res.json(null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
};

// GET /api/auth/customers-search?q=...
exports.searchCustomers = async (req, res) => {
  const { q = '' } = req.query;

  try {
    // ✅ Use Customer model directly for efficiency
    const query = {
      $or: [
        { phone: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    };
    
    const customers = await Customer.find(query).limit(20).sort({ updatedAt: -1 }).lean();
    res.json(customers);
  } catch (err) {
    console.error('Search customers error:', err);
    res.status(500).json({ error: 'Failed to search customers' });
  }
};

// GET /api/auth/customers-list
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalCount = await Customer.countDocuments({});
    const customers = await Customer.find({})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      customers,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ error: 'Failed to load customers' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to load order" });
  }
};

// GET /api/auth/cashier/takeaway-orders?status=Pending
// GET /api/auth/cashier/takeaway-orders
exports.getCashierTakeawayOrders = async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = {
      tableNo: "Takeaway"
    };

    if (status && ["Pending", "Processing", "Ready", "Completed"].includes(status)) {
      query.status = status;
    }

    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .select("-items.imageUrl")
      .populate("driverId", "name vehicle numberPlate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Failed to load takeaway orders:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/auth/drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({}).select("name vehicle numberPlate");
    res.json(drivers);
  } catch (err) {
    console.error("Failed to load drivers:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/auth/order/:id/delivery-status
exports.updateDeliveryStatus = async (req, res) => {
  const { id } = req.params;
  const { deliveryStatus, driverId } = req.body;

  try {
    const updates = { deliveryStatus };
    if (deliveryStatus === "Driver Pending" && driverId) {
      updates.driverId = driverId;
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true })
      .populate("driverId", "name vehicle numberPlate");

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("Failed to update delivery status:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/auth/order/:id
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Optional: Only allow deletion if status is "Pending"
    // if (order.status !== "Pending") {
    //   return res.status(403).json({ error: "Only pending orders can be deleted" });
    // }

    // Restore stock
    // for (const item of order.items) {
    //   await Menu.findByIdAndUpdate(item.menuId, {
    //     $inc: { currentQty: item.quantity }
    //   });
    // }

    // Delete the order
    await Order.findByIdAndDelete(id);

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Failed to delete order:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};