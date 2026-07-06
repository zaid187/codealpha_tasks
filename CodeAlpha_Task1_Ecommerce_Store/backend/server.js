const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

connectDB();

const app = express();
const productRoutes = require("./routes/productRoutes");
const orderRoutes =
require("./routes/orderRoutes");
const authRoutes =
require("./routes/authRoutes");

app.use(
    cors({
      origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://e-commerce-store-eight-beta.vercel.app",
      ],
      credentials: true,
    })
  );
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req,res)=>{
    res.send("Ecommerce API Running");
});

const PORT = process.env.PORT || 5000;

app.get("/test", (req, res) => {
    res.send("WORKING");
});

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`);
});
