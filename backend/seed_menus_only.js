const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Import models
const User = require("./models/User");
const Menu = require("./models/Menu");
const Employee = require("./models/Employee");
const Supplier = require("./models/Supplier");
const Driver = require("./models/Driver");
const ServiceCharge = require("./models/ServiceCharge");
const DeliveryCharge = require("./models/DeliveryCharge");
const CurrencySetting = require("./models/CurrencySetting");
const RestaurantSetting = require("./models/RestaurantSetting");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully for seeding menus and logins.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  console.log("Starting menu and login restore process...");

  // 1. Create Default Users (if not exist)
  console.log("Checking Users...");
  const adminExists = await User.findOne({ role: "admin" });
  let adminId;
  if (!adminExists) {
    const adminUser = new User({
      name: "Admin User",
      email: "admin@rms.com",
      password: "admin123",
      role: "admin",
      isActive: true,
    });
    await adminUser.save();
    adminId = adminUser._id;
    console.log("Admin user created.");
  } else {
    adminId = adminExists._id;
    console.log("Admin user already exists.");
  }

  const cashierExists = await User.findOne({ role: "cashier" });
  let cashierId;
  if (!cashierExists) {
    const cashierUser = new User({
      name: "Cashier User",
      email: "cashier@rms.com",
      password: "cashier123",
      role: "cashier",
      isActive: true,
    });
    await cashierUser.save();
    cashierId = cashierUser._id;
    console.log("Cashier user created.");
  } else {
    cashierId = cashierExists._id;
    console.log("Cashier user already exists.");
  }

  const kitchenExists = await User.findOne({ role: "kitchen" });
  if (!kitchenExists) {
    const kitchenUser = new User({
      name: "Kitchen User",
      email: "kitchen@rms.com",
      password: "kitchen123",
      role: "kitchen",
      isActive: true,
    });
    await kitchenUser.save();
    console.log("Kitchen user created.");
  } else {
    console.log("Kitchen user already exists.");
  }

  // 2. Create Settings if they don't exist
  console.log("Checking Settings...");
  const currencyExists = await CurrencySetting.findOne({});
  if (!currencyExists) {
    await new CurrencySetting({ currency: "LKR", symbol: "Rs." }).save();
    console.log("Currency setting created.");
  }

  const restaurantSettingsExists = await RestaurantSetting.findOne({});
  if (!restaurantSettingsExists) {
    await new RestaurantSetting({
      name: "A&A Roasted Chicken",
      address: "337C, Galle Road, Mt. Lavinia",
      phone: "0769 886 887",
      email: "aandafoods2026@gmail.com",
      logo: ""
    }).save();
    console.log("Restaurant settings created.");
  }

  const serviceChargeExists = await ServiceCharge.findOne({});
  if (!serviceChargeExists) {
    await new ServiceCharge({ dineInCharge: 10, isActive: true }).save();
    console.log("Service charge setting created.");
  }

  const deliveryChargeExists = await DeliveryCharge.findOne({});
  if (!deliveryChargeExists) {
    await new DeliveryCharge({ amount: 300, isActive: true }).save();
    console.log("Delivery charge setting created.");
  }

  // 3. Create Suppliers if none exist
  const supplierCount = await Supplier.countDocuments({});
  if (supplierCount === 0) {
    console.log("Seeding Suppliers...");
    const suppliers = [
      {
        name: "Fresh Farms Ltd",
        companyName: "Fresh Farms",
        contact: "0112345678",
        email: "freshfarms@mail.com",
        address: "No. 12, Farm Road, Nuwara Eliya"
      },
      {
        name: "Prime Meats",
        companyName: "Prime Meats",
        contact: "0118765432",
        email: "primemeats@mail.com",
        address: "No. 45, Butcher Street, Colombo 10"
      },
      {
        name: "Daily Beverages",
        companyName: "Daily Beverages",
        contact: "0113334445",
        email: "beverages@mail.com",
        address: "No. 88, Drink Avenue, Gampaha"
      }
    ];
    await Supplier.insertMany(suppliers);
    console.log("Suppliers seeded.");
  }

  // 4. Create Drivers if none exist
  const driverCount = await Driver.countDocuments({});
  if (driverCount === 0) {
    console.log("Seeding Drivers...");
    const drivers = [
      {
        name: "Ravi Kumara",
        nic: "199411223344",
        vehicle: "Motorbike",
        numberPlate: "WP-BGG-1234",
        address: "No. 4, Temple Road, Dehiwala",
        phone: "0777123456",
        addedBy: cashierId
      },
      {
        name: "Nimal Perera",
        nic: "199122334455",
        vehicle: "Motorbike",
        numberPlate: "WP-BJJ-5678",
        address: "No. 15, Station Road, Mount Lavinia",
        phone: "0711123456",
        addedBy: cashierId
      }
    ];
    await Driver.insertMany(drivers);
    console.log("Drivers seeded.");
  }

  // 5. Create Employees if none exist
  const employeeCount = await Employee.countDocuments({});
  if (employeeCount === 0) {
    console.log("Seeding Employees...");
    const employees = [
      {
        id: "EMP-0001",
        name: "John Doe",
        nic: "199012345678",
        phone: "0771234567",
        role: "Chef",
        basicSalary: 45000,
        workingHours: 8,
        otHourRate: 200,
        bankAccountNo: "1234567890"
      },
      {
        id: "EMP-0002",
        name: "Sarah Connor",
        nic: "199298765432",
        phone: "0711234567",
        role: "Cashier",
        basicSalary: 35000,
        workingHours: 8,
        otHourRate: 150,
        bankAccountNo: "0987654321"
      },
      {
        id: "EMP-0003",
        name: "Michael Scott",
        nic: "198512345999",
        phone: "0721234567",
        role: "Waiter",
        basicSalary: 25000,
        workingHours: 8,
        otHourRate: 100,
        bankAccountNo: "1122334455"
      },
      {
        id: "EMP-0004",
        name: "Dwight Schrute",
        nic: "198812345111",
        phone: "0751234567",
        role: "Waiter",
        basicSalary: 25000,
        workingHours: 8,
        otHourRate: 100,
        bankAccountNo: "5544332211"
      }
    ];
    await Employee.insertMany(employees);
    console.log("Employees seeded.");
  }

  // 6. Create Menu Items (if none exist)
  const menuCount = await Menu.countDocuments({});
  if (menuCount === 0) {
    console.log("Seeding Menus...");
    const menus = [
      {
        name: "Classic Beef Burger",
        description: "Juicy flame-grilled beef patty with cheese, fresh lettuce, tomato, and house burger sauce, served in a toasted brioche bun.",
        price: 1200,
        cost: 700,
        category: "Burgers & Sandwiches",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 45,
        menuStatus: "In Stock"
      },
      {
        name: "Crispy Chicken Burger",
        description: "Crispy golden fried chicken breast, spicy mayo, pickles, and shredded lettuce on a toasted bun.",
        price: 1100,
        cost: 600,
        category: "Burgers & Sandwiches",
        imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 50,
        menuStatus: "In Stock"
      },
      {
        name: "Cheesy Pepperoni Pizza",
        description: "Classic pizza topped with premium pepperoni, rich marinara sauce, and loaded with melted mozzarella cheese.",
        price: 2400,
        cost: 1300,
        category: "Main Course",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        minimumQty: 5,
        currentQty: 25,
        menuStatus: "In Stock"
      },
      {
        name: "Margherita Pizza",
        description: "Simple yet delicious pizza topped with fresh tomatoes, basil, mozzarella, and a drizzle of olive oil.",
        price: 1800,
        cost: 950,
        category: "Main Course",
        imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
        minimumQty: 5,
        currentQty: 30,
        menuStatus: "In Stock"
      },
      {
        name: "Seafood Fried Rice",
        description: "Wok-tossed basmati rice with fresh prawns, cuttlefish, egg, and spring onions, seasoned with Asian spices.",
        price: 1500,
        cost: 850,
        category: "Main Course",
        imageUrl: "https://images.unsplash.com/photo-1603133872878-685f5888c3c1?auto=format&fit=crop&w=600&q=80",
        minimumQty: 15,
        currentQty: 60,
        menuStatus: "In Stock"
      },
      {
        name: "Spaghetti Bolognese",
        description: "Al dente spaghetti served with a rich, slow-simmered minced beef Bolognese sauce and topped with parmesan.",
        price: 1650,
        cost: 900,
        category: "Main Course",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 40,
        menuStatus: "In Stock"
      },
      {
        name: "Creamy Chicken Alfredo Pasta",
        description: "Fettuccine pasta tossed in a creamy, velvety parmesan cheese and butter sauce, topped with grilled chicken strips.",
        price: 1750,
        cost: 950,
        category: "Main Course",
        imageUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 35,
        menuStatus: "In Stock"
      },
      {
        name: "Loaded French Fries",
        description: "Golden crispy french fries smothered in warm cheese sauce, jalapenos, and crispy turkey bacon bits.",
        price: 750,
        cost: 350,
        category: "Starters",
        imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
        minimumQty: 20,
        currentQty: 80,
        menuStatus: "In Stock"
      },
      {
        name: "Crispy Vegetable Spring Rolls",
        description: "Crispy pastry wrapper filled with a spiced mix of cabbage, carrots, glass noodles, served with sweet chili sauce (4 pcs).",
        price: 650,
        cost: 280,
        category: "Starters",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        minimumQty: 15,
        currentQty: 50,
        menuStatus: "In Stock"
      },
      {
        name: "Hot & Sour Chicken Soup",
        description: "A spicy and tangy broth packed with shredded chicken, mushrooms, bamboo shoots, and wispy beaten eggs.",
        price: 800,
        cost: 400,
        category: "Soups & Salads",
        imageUrl: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 25,
        menuStatus: "In Stock"
      },
      {
        name: "Classic Caesar Salad",
        description: "Crisp romaine lettuce tossed in creamy Caesar dressing, garlic croutons, and grated parmesan cheese.",
        price: 1100,
        cost: 500,
        category: "Soups & Salads",
        imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80",
        minimumQty: 8,
        currentQty: 20,
        menuStatus: "In Stock"
      },
      {
        name: "Fresh Orange Juice",
        description: "100% natural, freshly squeezed orange juice served chilled over ice.",
        price: 450,
        cost: 150,
        category: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80",
        minimumQty: 25,
        currentQty: 100,
        menuStatus: "In Stock"
      },
      {
        name: "Iced Caramel Macchiato",
        description: "Chilled espresso with milk, rich caramel syrup, topped with caramel drizzle.",
        price: 650,
        cost: 250,
        category: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
        minimumQty: 15,
        currentQty: 40,
        menuStatus: "In Stock"
      },
      {
        name: "Coca Cola (Can)",
        description: "Chilled classic Coca-Cola can (330ml).",
        price: 250,
        cost: 120,
        category: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        minimumQty: 30,
        currentQty: 120,
        menuStatus: "In Stock"
      },
      {
        name: "Fudge Brownie with Ice Cream",
        description: "Warm fudgy chocolate brownie topped with a scoop of vanilla bean ice cream and chocolate fudge sauce.",
        price: 750,
        cost: 320,
        category: "Desserts",
        imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
        minimumQty: 10,
        currentQty: 30,
        menuStatus: "In Stock"
      },
      {
        name: "Strawberry Cheesecake Slice",
        description: "Creamy cheesecake on a buttery graham cracker crust, topped with fresh strawberry compote.",
        price: 850,
        cost: 400,
        category: "Desserts",
        imageUrl: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=600&q=80",
        minimumQty: 5,
        currentQty: 15,
        menuStatus: "In Stock"
      }
    ];
    await Menu.insertMany(menus);
    console.log("Menus seeded.");
  }

  console.log("Menus and logins restored successfully! Recovered orders and customers remain safe.");
  process.exit(0);
};

seed();
