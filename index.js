const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable CORS for all routes (so your frontend can connect)
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// --- Routes ---
// Import your route files
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin"); // We will create this soon
const shipmentRoutes = require("./routes/shipments");

// Tell the app to use your route files
// All routes in 'auth.js' will be prefixed with /api/auth
app.use("/api/auth", authRoutes);
// All routes in 'admin.js' will be prefixed with /api/admin
app.use("/api/admin", adminRoutes);

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ... (other imports)

// Tell the app to use your route files
// All routes in 'auth.js' will be prefixed with /api/auth
app.use("/api/auth", authRoutes);
// All routes in 'admin.js' will be prefixed with /api/admin
app.use("/api/admin", adminRoutes);
// All routes in 'shipments.js' will be prefixed with /api/shipments
app.use("/api/shipments", shipmentRoutes); // <-- ADD THIS LINE

// --- Start the Server ---
// ...
