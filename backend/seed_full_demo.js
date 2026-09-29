const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

// Import models
const User = require("./models/User");
const Menu = require("./models/Menu");
const Employee = require("./models/Employee");
const Supplier = require("./models/Supplier");
const Driver = require("./models/Driver");
const ServiceCharge = require("./models/ServiceCharge");
const DeliveryCharge = require("./models/DeliveryCharge");
const DeliveryChargeByPlace = require("./models/DeliveryChargeByPlace");
const CurrencySetting = require("./models/CurrencySetting");
const RestaurantSetting = require("./models/RestaurantSetting");
const Order = require("./models/Order");
const Customer = require("./models/Customer");
const Attendance = require("./models/Attendance");
const OtherExpense = require("./models/OtherExpense");
const OtherIncome = require("./models/OtherIncome");
const KitchenRequest = require("./models/KitchenRequest");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB. Starting full demo seed...\n");

    const db = mongoose.connection.db;

    // ===== 1. USERS =====
    await db.collection("users").deleteMany({});
    const adminUser = new User({ name: "Admin User", email: "admin@restaurant.com", password: "AandA@2026", role: "admin", isActive: true });
    const cashierUser = new User({ name: "Cashier User", email: "cashier@restaurant.com", password: "New@1111", role: "cashier", isActive: true });
    const kitchenUser = new User({ name: "Kitchen User", email: "kitchen@restaurant.com", password: "New@1111", role: "kitchen", isActive: true });
    await adminUser.save(); await cashierUser.save(); await kitchenUser.save();
    console.log("✅ Users seeded (Admin, Cashier, Kitchen)");

    // ===== 2. SETTINGS =====
    await db.collection("currencysettings").deleteMany({});
    await new CurrencySetting({ currency: "LKR", symbol: "Rs." }).save();

    await db.collection("servicecharges").deleteMany({});
    await new ServiceCharge({ dineInCharge: 10, isActive: true }).save();

    await db.collection("deliverycharges").deleteMany({});
    await new DeliveryCharge({ amount: 300, isActive: true }).save();

    let base64Logo = "";
    const fs = require("fs");
    const logoPath = path.join(__dirname, "../frontend/src/upload/logo.png");
    if (fs.existsSync(logoPath)) {
      base64Logo = "data:image/png;base64," + fs.readFileSync(logoPath).toString("base64");
    }

    await db.collection("restaurantsettings").deleteMany({});
    await new RestaurantSetting({
      name: "A&A Roasted Chicken",
      address: "337C, Galle Road, Mt. Lavinia",
      phone: "0769 886 887",
      email: "aandafoods2026@gmail.com",
      logo: base64Logo
    }).save();

    console.log("✅ Settings seeded (Currency, Service Charge, Delivery Charge, Restaurant Settings)");

    // ===== 3. DELIVERY PLACES =====
    await db.collection("deliverychargebyplaces").deleteMany({});
    const deliveryPlaces = [
      { placeName: "Colombo 01", charge: 250 },
      { placeName: "Colombo 03", charge: 250 },
      { placeName: "Colombo 05", charge: 300 },
      { placeName: "Colombo 07", charge: 300 },
      { placeName: "Nugegoda", charge: 350 },
      { placeName: "Maharagama", charge: 400 },
      { placeName: "Kottawa", charge: 450 },
      { placeName: "Moratuwa", charge: 400 },
      { placeName: "Dehiwala", charge: 300 },
      { placeName: "Mount Lavinia", charge: 350 }
    ];
    await db.collection("deliverychargebyplaces").insertMany(deliveryPlaces);
    console.log("✅ Delivery places seeded (10 locations)");

    // ===== 4. SUPPLIERS =====
    await db.collection("suppliers").deleteMany({});
    await Supplier.insertMany([
      { name: "Suresh Fernando", companyName: "Fresh Farms Lanka", contact: "0112345678", email: "freshfarms@mail.com", address: "No. 12, Farm Road, Nuwara Eliya" },
      { name: "Saman Jayawardena", companyName: "Prime Meats Lanka", contact: "0118765432", email: "primemeats@mail.com", address: "No. 45, Butcher Street, Colombo 10" },
      { name: "Kamal Perera", companyName: "Daily Beverages Co.", contact: "0113334445", email: "beverages@mail.com", address: "No. 88, Drink Avenue, Gampaha" },
      { name: "Nimal Dissanayake", companyName: "Rice & Grain Traders", contact: "0119876543", email: "grains@mail.com", address: "No. 22, Market Street, Kurunegala" }
    ]);
    console.log("✅ Suppliers seeded (4 suppliers)");

    // ===== 5. EMPLOYEES =====
    await db.collection("employees").deleteMany({});
    const emp1 = await Employee.create({ id: "EMP-0001", name: "Ruwan Kumara", nic: "199012301234", phone: "0771234561", role: "Chef", basicSalary: 55000, workingHours: 8, otHourRate: 250, bankAccountNo: "1234567890" });
    const emp2 = await Employee.create({ id: "EMP-0002", name: "Dilani Perera", nic: "199298701234", phone: "0712345671", role: "Waiter", basicSalary: 30000, workingHours: 8, otHourRate: 120, bankAccountNo: "0987654321" });
    const emp3 = await Employee.create({ id: "EMP-0003", name: "Chaminda Silva", nic: "198812301235", phone: "0752345671", role: "Waiter", basicSalary: 30000, workingHours: 8, otHourRate: 120, bankAccountNo: "1122334456" });
    const emp4 = await Employee.create({ id: "EMP-0004", name: "Tharanga Bandara", nic: "199512301236", phone: "0762345671", role: "Cashier", basicSalary: 40000, workingHours: 8, otHourRate: 180, bankAccountNo: "5566778899" });
    console.log("✅ Employees seeded (4 employees)");

    // ===== 6. DRIVERS =====
    await db.collection("drivers").deleteMany({});
    const driver1 = await Driver.create({ name: "Ravi Kumara", nic: "199411224321", vehicle: "Motorbike", numberPlate: "WP-BGG-1234", address: "No. 4, Temple Road, Dehiwala", phone: "0777123451", addedBy: cashierUser._id });
    const driver2 = await Driver.create({ name: "Nimal Perera", nic: "199122334456", vehicle: "Motorbike", numberPlate: "WP-BJJ-5678", address: "No. 15, Station Road, Mount Lavinia", phone: "0711123451", addedBy: cashierUser._id });
    console.log("✅ Drivers seeded (2 drivers)");

    // ===== 7. MENUS =====
    await db.collection("menus").deleteMany({});
    const menus = await Menu.insertMany([
      { name: "Classic Beef Burger", description: "Juicy flame-grilled beef patty with cheese, lettuce, tomato, and house sauce in a brioche bun.", price: 1200, cost: 650, category: "Burgers & Sandwiches", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 50, menuStatus: "In Stock" },
      { name: "Crispy Chicken Burger", description: "Golden fried chicken breast, spicy mayo, pickles, and shredded lettuce on a toasted bun.", price: 1100, cost: 580, category: "Burgers & Sandwiches", imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 45, menuStatus: "In Stock" },
      { name: "Cheesy Pepperoni Pizza", description: "Classic pizza with pepperoni, marinara sauce, and loaded mozzarella cheese.", price: 2400, cost: 1200, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", minimumQty: 5, currentQty: 20, menuStatus: "In Stock" },
      { name: "Margherita Pizza", description: "Fresh tomatoes, basil, mozzarella, and a drizzle of olive oil.", price: 1800, cost: 900, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80", minimumQty: 5, currentQty: 25, menuStatus: "In Stock" },
      { name: "Seafood Fried Rice", description: "Wok-tossed basmati rice with prawns, cuttlefish, egg, and spring onions.", price: 1500, cost: 780, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1603133872878-685f5888c3c1?auto=format&fit=crop&w=600&q=80", minimumQty: 15, currentQty: 60, menuStatus: "In Stock" },
      { name: "Spaghetti Bolognese", description: "Al dente spaghetti with rich slow-simmered minced beef Bolognese sauce and parmesan.", price: 1650, cost: 850, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 35, menuStatus: "In Stock" },
      { name: "Creamy Chicken Alfredo Pasta", description: "Fettuccine in a velvety parmesan sauce topped with grilled chicken strips.", price: 1750, cost: 900, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 30, menuStatus: "In Stock" },
      { name: "Kottu Roti - Chicken", description: "Sri Lankan-style chopped roti stir-fried with chicken, vegetables, egg, and spices.", price: 900, cost: 420, category: "Main Course", imageUrl: "https://images.unsplash.com/photo-1697572741459-0e682f3c4bb4?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 40, menuStatus: "In Stock" },
      { name: "Loaded French Fries", description: "Golden fries smothered in cheese sauce, jalapeños, and crispy bacon bits.", price: 750, cost: 320, category: "Starters", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", minimumQty: 20, currentQty: 80, menuStatus: "In Stock" },
      { name: "Crispy Vegetable Spring Rolls", description: "Crispy pastry filled with cabbage, carrots, glass noodles, served with sweet chili sauce (4 pcs).", price: 650, cost: 260, category: "Starters", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", minimumQty: 15, currentQty: 50, menuStatus: "In Stock" },
      { name: "Hot & Sour Chicken Soup", description: "Spicy tangy broth with shredded chicken, mushrooms, bamboo shoots, and beaten eggs.", price: 800, cost: 380, category: "Soups & Salads", imageUrl: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 25, menuStatus: "In Stock" },
      { name: "Classic Caesar Salad", description: "Crisp romaine, creamy Caesar dressing, garlic croutons, and grated parmesan.", price: 1100, cost: 480, category: "Soups & Salads", imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80", minimumQty: 8, currentQty: 20, menuStatus: "In Stock" },
      { name: "Fresh Orange Juice", description: "100% natural freshly squeezed orange juice served chilled over ice.", price: 450, cost: 140, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80", minimumQty: 25, currentQty: 100, menuStatus: "In Stock" },
      { name: "Iced Caramel Macchiato", description: "Chilled espresso with milk and rich caramel syrup topped with caramel drizzle.", price: 650, cost: 230, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80", minimumQty: 15, currentQty: 40, menuStatus: "In Stock" },
      { name: "Coca Cola (Can)", description: "Chilled classic Coca-Cola can (330ml).", price: 250, cost: 110, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", minimumQty: 30, currentQty: 120, menuStatus: "In Stock" },
      { name: "Fudge Brownie with Ice Cream", description: "Warm fudgy chocolate brownie topped with vanilla bean ice cream and chocolate fudge sauce.", price: 750, cost: 300, category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", minimumQty: 10, currentQty: 30, menuStatus: "In Stock" },
      { name: "Strawberry Cheesecake Slice", description: "Creamy cheesecake on a buttery graham cracker crust, topped with fresh strawberry compote.", price: 850, cost: 380, category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=600&q=80", minimumQty: 5, currentQty: 15, menuStatus: "In Stock" }
    ]);
    console.log(`✅ Menus seeded (${menus.length} items)`);

    // ===== 8. SAMPLE ORDERS (last 7 days) =====
    await db.collection("orders").deleteMany({});
    const today = new Date();
    const mkDate = (daysAgo, hour, min) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, min, 0, 0);
      return d;
    };

    const sampleOrders = [
      {
        invoiceNo: "INV-DEMO-001", customerName: "Kasun Perera", customerPhone: "0771234561",
        tableNo: "Table 1", items: [{ menuId: menus[0]._id, name: menus[0].name, price: 1200, netProfit: 550, quantity: 2, imageUrl: menus[0].imageUrl }],
        subtotal: 2400, serviceCharge: 240, deliveryType: "Customer Pickup", deliveryCharge: 0,
        deliveryStatus: "Customer Picked Up", totalPrice: 2640,
        payment: { cash: 3000, card: 0, bankTransfer: 0, totalPaid: 3000, changeDue: 360, notes: "" },
        cashierId: cashierUser._id, waiterId: emp2._id, waiterName: emp2.name,
        status: "Completed", statusUpdatedAt: mkDate(6, 12, 30), createdAt: mkDate(6, 12, 30), updatedAt: mkDate(6, 12, 30)
      },
      {
        invoiceNo: "INV-DEMO-002", customerName: "Nimali Silva", customerPhone: "0712345672",
        tableNo: "Table 3", items: [
          { menuId: menus[2]._id, name: menus[2].name, price: 2400, netProfit: 1200, quantity: 1, imageUrl: menus[2].imageUrl },
          { menuId: menus[12]._id, name: menus[12].name, price: 450, netProfit: 310, quantity: 2, imageUrl: menus[12].imageUrl }
        ],
        subtotal: 3300, serviceCharge: 330, deliveryType: "Customer Pickup", deliveryCharge: 0,
        deliveryStatus: "Customer Picked Up", totalPrice: 3630,
        payment: { cash: 4000, card: 0, bankTransfer: 0, totalPaid: 4000, changeDue: 370, notes: "" },
        cashierId: cashierUser._id, waiterId: emp3._id, waiterName: emp3.name,
        status: "Completed", statusUpdatedAt: mkDate(5, 13, 45), createdAt: mkDate(5, 13, 45), updatedAt: mkDate(5, 13, 45)
      },
      {
        invoiceNo: "INV-DEMO-003", customerName: "Cash", customerPhone: "0778901234",
        tableNo: "Takeaway", items: [{ menuId: menus[4]._id, name: menus[4].name, price: 1500, netProfit: 720, quantity: 3, imageUrl: menus[4].imageUrl }],
        subtotal: 4500, serviceCharge: 0, deliveryType: "Delivery Service", deliveryPlaceName: "Colombo 05",
        deliveryCharge: 300, deliveryStatus: "Order Delivered", driverId: driver1._id, totalPrice: 4800,
        payment: { cash: 5000, card: 0, bankTransfer: 0, totalPaid: 5000, changeDue: 200, notes: "" },
        cashierId: cashierUser._id, waiterId: null, waiterName: null,
        status: "Completed", statusUpdatedAt: mkDate(5, 18, 20), createdAt: mkDate(5, 18, 20), updatedAt: mkDate(5, 18, 20)
      },
      {
        invoiceNo: "INV-DEMO-004", customerName: "Saman Bandara", customerPhone: "0762345673",
        tableNo: "Table 2", items: [
          { menuId: menus[6]._id, name: menus[6].name, price: 1750, netProfit: 850, quantity: 1, imageUrl: menus[6].imageUrl },
          { menuId: menus[8]._id, name: menus[8].name, price: 750, netProfit: 430, quantity: 2, imageUrl: menus[8].imageUrl }
        ],
        subtotal: 3250, serviceCharge: 325, deliveryType: "Customer Pickup", deliveryCharge: 0,
        deliveryStatus: "Customer Picked Up", totalPrice: 3575,
        payment: { cash: 0, card: 3575, bankTransfer: 0, totalPaid: 3575, changeDue: 0, notes: "" },
        cashierId: cashierUser._id, waiterId: emp2._id, waiterName: emp2.name,
        status: "Completed", statusUpdatedAt: mkDate(4, 19, 10), createdAt: mkDate(4, 19, 10), updatedAt: mkDate(4, 19, 10)
      },
      {
        invoiceNo: "INV-DEMO-005", customerName: "Cash", customerPhone: "0729012345",
        tableNo: "Takeaway", items: [{ menuId: menus[1]._id, name: menus[1].name, price: 1100, netProfit: 520, quantity: 2, imageUrl: menus[1].imageUrl }],
        subtotal: 2200, serviceCharge: 0, deliveryType: "Delivery Service", deliveryPlaceName: "Nugegoda",
        deliveryCharge: 350, deliveryStatus: "Order Delivered", driverId: driver2._id, totalPrice: 2550,
        payment: { cash: 0, card: 0, bankTransfer: 2550, totalPaid: 2550, changeDue: 0, notes: "Bank transfer confirmed" },
        cashierId: cashierUser._id, waiterId: null, waiterName: null,
        status: "Completed", statusUpdatedAt: mkDate(3, 12, 0), createdAt: mkDate(3, 12, 0), updatedAt: mkDate(3, 12, 0)
      },
      {
        invoiceNo: "INV-DEMO-006", customerName: "Ishara Fernando", customerPhone: "0741234567",
        tableNo: "Table 5", items: [
          { menuId: menus[3]._id, name: menus[3].name, price: 1800, netProfit: 900, quantity: 1, imageUrl: menus[3].imageUrl },
          { menuId: menus[15]._id, name: menus[15].name, price: 750, netProfit: 450, quantity: 2, imageUrl: menus[15].imageUrl }
        ],
        subtotal: 3300, serviceCharge: 330, deliveryType: "Customer Pickup", deliveryCharge: 0,
        deliveryStatus: "Customer Picked Up", totalPrice: 3630,
        payment: { cash: 4000, card: 0, bankTransfer: 0, totalPaid: 4000, changeDue: 370, notes: "" },
        cashierId: cashierUser._id, waiterId: emp3._id, waiterName: emp3.name,
        status: "Completed", statusUpdatedAt: mkDate(2, 20, 30), createdAt: mkDate(2, 20, 30), updatedAt: mkDate(2, 20, 30)
      },
      {
        invoiceNo: "INV-DEMO-007", customerName: "Cash", customerPhone: "0773456789",
        tableNo: "Takeaway", items: [
          { menuId: menus[7]._id, name: menus[7].name, price: 900, netProfit: 480, quantity: 2, imageUrl: menus[7].imageUrl },
          { menuId: menus[14]._id, name: menus[14].name, price: 250, netProfit: 140, quantity: 3, imageUrl: menus[14].imageUrl }
        ],
        subtotal: 2550, serviceCharge: 0, deliveryType: "Customer Pickup",
        deliveryStatus: "Customer Picked Up", totalPrice: 2550,
        payment: { cash: 3000, card: 0, bankTransfer: 0, totalPaid: 3000, changeDue: 450, notes: "" },
        cashierId: cashierUser._id, waiterId: null, waiterName: null,
        status: "Completed", statusUpdatedAt: mkDate(1, 11, 15), createdAt: mkDate(1, 11, 15), updatedAt: mkDate(1, 11, 15)
      },
      {
        invoiceNo: "INV-DEMO-008", customerName: "Priya Jayasinghe", customerPhone: "0784567890",
        tableNo: "Table 4", items: [
          { menuId: menus[5]._id, name: menus[5].name, price: 1650, netProfit: 800, quantity: 1, imageUrl: menus[5].imageUrl },
          { menuId: menus[11]._id, name: menus[11].name, price: 1100, netProfit: 620, quantity: 1, imageUrl: menus[11].imageUrl },
          { menuId: menus[13]._id, name: menus[13].name, price: 650, netProfit: 420, quantity: 1, imageUrl: menus[13].imageUrl }
        ],
        subtotal: 3400, serviceCharge: 340, deliveryType: "Customer Pickup", deliveryCharge: 0,
        deliveryStatus: "Customer Picked Up", totalPrice: 3740,
        payment: { cash: 4000, card: 0, bankTransfer: 0, totalPaid: 4000, changeDue: 260, notes: "" },
        cashierId: cashierUser._id, waiterId: emp2._id, waiterName: emp2.name,
        status: "Completed", statusUpdatedAt: mkDate(1, 19, 45), createdAt: mkDate(1, 19, 45), updatedAt: mkDate(1, 19, 45)
      },
      {
        invoiceNo: "INV-DEMO-009", customerName: "Cash", customerPhone: "0795678901",
        tableNo: "Takeaway", items: [{ menuId: menus[9]._id, name: menus[9].name, price: 650, netProfit: 390, quantity: 4, imageUrl: menus[9].imageUrl }],
        subtotal: 2600, serviceCharge: 0, deliveryType: "Delivery Service", deliveryPlaceName: "Maharagama",
        deliveryCharge: 400, deliveryStatus: "Order Delivered", driverId: driver1._id, totalPrice: 3000,
        payment: { cash: 3000, card: 0, bankTransfer: 0, totalPaid: 3000, changeDue: 0, notes: "" },
        cashierId: cashierUser._id, waiterId: null, waiterName: null,
        status: "Completed", statusUpdatedAt: mkDate(0, 12, 30), createdAt: mkDate(0, 12, 30), updatedAt: mkDate(0, 12, 30)
      },
      {
        invoiceNo: "INV-DEMO-010", customerName: "Cash", customerPhone: "0706789012",
        tableNo: "Takeaway", items: [
          { menuId: menus[0]._id, name: menus[0].name, price: 1200, netProfit: 550, quantity: 1, imageUrl: menus[0].imageUrl },
          { menuId: menus[8]._id, name: menus[8].name, price: 750, netProfit: 430, quantity: 1, imageUrl: menus[8].imageUrl },
          { menuId: menus[12]._id, name: menus[12].name, price: 450, netProfit: 310, quantity: 2, imageUrl: menus[12].imageUrl }
        ],
        subtotal: 2850, serviceCharge: 0, deliveryType: "Customer Pickup",
        deliveryStatus: "Customer Picked Up", totalPrice: 2850,
        payment: { cash: 3000, card: 0, bankTransfer: 0, totalPaid: 3000, changeDue: 150, notes: "" },
        cashierId: cashierUser._id, waiterId: null, waiterName: null,
        status: "Completed", statusUpdatedAt: mkDate(0, 18, 0), createdAt: mkDate(0, 18, 0), updatedAt: mkDate(0, 18, 0)
      }
    ];

    await Order.insertMany(sampleOrders);
    console.log(`✅ Orders seeded (${sampleOrders.length} orders - last 7 days)`);

    // ===== 9. CUSTOMERS =====
    await db.collection("customers").deleteMany({});
    const customerPhones = [...new Set(sampleOrders.filter(o => o.customerName !== "Cash").map(o => o.customerPhone))];
    const customerDocs = sampleOrders.filter(o => o.customerName !== "Cash").map(o => ({
      name: o.customerName, phone: o.customerPhone, createdAt: o.createdAt, updatedAt: o.updatedAt
    }));
    const uniqueCustomers = [];
    const seen = new Set();
    for (const c of customerDocs) {
      if (!seen.has(c.phone)) { seen.add(c.phone); uniqueCustomers.push(c); }
    }
    await Customer.insertMany(uniqueCustomers);
    console.log(`✅ Customers seeded (${uniqueCustomers.length} customers)`);

    // ===== 10. ATTENDANCE (last 7 days) =====
    await db.collection("attendances").deleteMany({});
    const attendanceRecords = [];
    const allEmps = [emp1, emp2, emp3, emp4];
    for (let day = 6; day >= 0; day--) {
      for (const emp of allEmps) {
        const d = mkDate(day, 8, 0);
        attendanceRecords.push({
          employeeId: emp._id,
          date: d,
          punches: [
            { time: "08:00 AM", type: "In" },
            { time: "01:00 PM", type: "Break In" },
            { time: "02:00 PM", type: "Break Out" },
            { time: "05:00 PM", type: "Out" }
          ]
        });
      }
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Attendance seeded (${attendanceRecords.length} records)`);

    // ===== 11. OTHER INCOME =====
    await db.collection("otherincomes").deleteMany({});
    await OtherIncome.insertMany([
      { source: "Event Booking", description: "Event Booking Fee", amount: 15000, date: mkDate(5, 10, 0), paymentMethod: "Cash", addedBy: adminUser._id },
      { source: "Room Rental", description: "Private Dining Room Rental", amount: 8000, date: mkDate(3, 11, 0), paymentMethod: "Bank Transfer", addedBy: adminUser._id },
      { source: "Catering", description: "Catering Service", amount: 25000, date: mkDate(1, 9, 0), paymentMethod: "Cash", addedBy: adminUser._id }
    ]);
    console.log("✅ Other Income seeded (3 records)");

    // ===== 12. OTHER EXPENSES =====
    await db.collection("otherexpenses").deleteMany({});
    await OtherExpense.insertMany([
      { category: "Utilities", description: "Electricity Bill", amount: 22000, date: mkDate(6, 10, 0), paymentMethod: "Bank Transfer", addedBy: adminUser._id },
      { category: "Utilities", description: "Water Bill", amount: 5500, date: mkDate(6, 10, 0), paymentMethod: "Cash", addedBy: adminUser._id },
      { category: "Supplies", description: "Gas Refill", amount: 8000, date: mkDate(4, 10, 0), paymentMethod: "Cash", addedBy: adminUser._id },
      { category: "Maintenance", description: "Equipment Maintenance", amount: 12000, date: mkDate(2, 10, 0), paymentMethod: "Cash", addedBy: adminUser._id }
    ]);
    console.log("✅ Other Expenses seeded (4 records)");

    // ===== 13. KITCHEN REQUESTS =====
    await db.collection("kitchenrequests").deleteMany({});
    await KitchenRequest.insertMany([
      { item: "All-Purpose Flour", quantity: 25, unit: "kg", reason: "Stock running low", requestedBy: kitchenUser._id, status: "Pending", date: mkDate(1, 9, 0) },
      { item: "Chicken Breast", quantity: 15, unit: "kg", reason: "Weekly stock", requestedBy: kitchenUser._id, status: "Approved", date: mkDate(2, 9, 0) },
      { item: "Mozzarella Cheese", quantity: 10, unit: "kg", reason: "Pizza preparation", requestedBy: kitchenUser._id, status: "Approved", date: mkDate(3, 9, 0) }
    ]);
    console.log("✅ Kitchen Requests seeded (3 requests)");

    console.log("\n========================================");
    console.log("🎉 FULL DEMO DATA SEEDED SUCCESSFULLY!");
    console.log("========================================");
    console.log("Login Credentials:");
    console.log("  Admin   → admin@restaurant.com   / AandA@2026");
    console.log("  Cashier → cashier@restaurant.com / New@1111");
    console.log("  Kitchen → kitchen@restaurant.com / New@1111");
    console.log("========================================\n");

  } catch (err) {
    console.error("Seeding failed:", err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
};

seed();
