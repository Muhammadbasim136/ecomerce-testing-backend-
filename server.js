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

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server chal raha hai: http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.log("❌ MongoDB Error:", err.message);
  });
}
}

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

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

// ================================
// ROUTES
// ================================

// GET - Test Route
app.get("/", (req, res) => {
  res.send("✅ Backend Working");
});

// GET - Saare Products
app.get("/api/products", (req, res) => {
  // ⚠️ Price nahi bhejte frontend ko
  const publicProducts = Object.entries(PRODUCTS).map(([id, product]) => ({ // ✅ Fix: PRODUCTaS → PRODUCTS
    id: Number(id),
    name: product.name,
  }));
  res.json({ success: true, products: publicProducts });
});

// POST - Order Confirm Karo
app.post("/api/orders", async (req, res) => {
  try {
    await connectDB(); // ✅ Vercel ke liye har request pe connect

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
      const product = PRODUCTS[item.id];

      if (!product) {
        throw new Error(`❌ Product ID ${item.id} exist nahi karta!`);
      }

      if (!item.quantity || item.quantity < 1) {
        throw new Error(`❌ Quantity sahi nahi hai!`);
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      return {
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    // Order Save Karo
    const newOrder = new Order({
      customerName,
      customerEmail,
      products: verifiedProducts,
      totalAmount,
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
    await connectDB(); // ✅ Vercel ke liye
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

// ✅ Vercel ke liye module.exports
module.exports = app;

// ✅ Local development ke liye app.listen
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server chal raha hai: http://localhost:${PORT}`);
  });
}