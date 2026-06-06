require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Prices Backend Mein — Frontend Se Nahi Aayenge
const PRODUCTS = {
  1: { name: "iPhone 15 Pro", price: 299999 },
  2: { name: "Sony WH-1000XM5", price: 49999 },
  3: { name: "MacBook Air M3", price: 189999 },
  4: { name: "Nike Air Max", price: 15999 },
  5: { name: "Samsung 4K TV", price: 129999 },
  6: { name: "PS5 Console", price: 89999 },
};
 

 // ✅ Sahi — .then() add karo
mongoose
 .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce")
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Order Schema
const orderSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  products: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    default: "confirmed",
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

// ================================
// ROUTES
// ================================

// GET - Test Route
app.get("/", (req, res) => {
  res.json({ message: "✅ E-commerce Backend Chal Raha Hai!" });
});

// GET - Saare Products (Frontend Yahan Se Le Sakta Hai)
app.get("/api/products", (req, res) => {
  // ⚠️ Price nahi bhejte frontend ko
  const publicProducts = Object.entries(PRODUCTS).map(([id, product]) => ({
    id: Number(id),
    name: product.name,
  }));
  res.json({ success: true, products: publicProducts });
});

// POST - Order Confirm Karo
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerEmail, products } = req.body;

    // Validation
    if (!customerName || !customerEmail || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "❌ Naam, Email aur Products zaroor chahiye!",
      });
    }

    // ✅ Backend khud price calculate karega
    let totalAmount = 0;
    const verifiedProducts = products.map((item) => {
      const product = PRODUCTS[item.id]; // Backend se price lo

      if (!product) {
        throw new Error(`❌ Product ID ${item.id} exist nahi karta!`);
      }

      if (!item.quantity || item.quantity < 1) {
        throw new Error(`❌ Quantity sahi nahi hai!`);
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      return {
        name: product.name,       // ✅ Backend se name
        price: product.price,     // ✅ Backend se price
        quantity: item.quantity,  // Frontend se sirf quantity
      };
    });

    // Order Save Karo
    const newOrder = new Order({
      customerName,
      customerEmail,
      products: verifiedProducts,
      totalAmount, // ✅ Backend ne calculate kiya
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "✅ Order Confirm Ho Gaya!",
      order: newOrder,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET - Saare Orders Dekho
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json({
      success: true,
      totalOrders: orders.length,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// SERVER START
// ================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chal raha hai: http://localhost:${PORT}`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`📋 Orders API: http://localhost:${PORT}/api/orders`);
});