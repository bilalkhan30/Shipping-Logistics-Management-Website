const express = require("express");
const db = require("../db");
const { verifyToken, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// --- PROTECT ALL SHIPMENT ROUTES ---
router.use(verifyToken);

// === CREATE A NEW SHIPMENT ===
// Endpoint: POST /api/shipments/
router.post("/", async (req, res) => {
  try {
    const { id: requesterId } = req.user;
    const {
      "customer-name": customerName,
      phone,
      "user-role": userRole,
      "pickup-address": origin,
      destination,
      supplier,
      "item-description": itemDescription,
      "shipment-type": shipmentType,
      quantity,
      weight,
    } = req.body;

    const newShipment = await db.query(
      `INSERT INTO shipments (
        requester_id, requester_name, requester_phone, requester_role, 
        origin, destination, supplier_name, item_description, 
        shipment_type, quantity, weight_kg, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending')
      RETURNING id`,
      [
        requesterId,
        customerName,
        phone,
        userRole,
        origin,
        destination,
        supplier,
        itemDescription,
        shipmentType,
        quantity,
        weight,
      ]
    );

    const newId = newShipment.rows[0].id;
    const trackingId = `TRK-${newId.toString().padStart(5, "0")}`;
    await db.query(`UPDATE shipments SET tracking_id = $1 WHERE id = $2`, [
      trackingId,
      newId,
    ]);

    res.status(201).json({
      message: "Shipment created successfully!",
      trackingId: trackingId,
    });
  } catch (err) {
    console.error("Error creating shipment:", err);
    res.status(500).json({ message: "Server error while creating shipment." });
  }
});

// === GET ALL SHIPMENTS (ADMIN) ===
// Endpoint: GET /api/shipments/
router.get("/", checkAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        id,
        tracking_id,
        requester_name,
        origin,
        destination,
        status,
        supplier_name
      FROM shipments
      ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting all shipments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================================
// --- SPECIFIC ROUTES (MUST BE BEFORE GENERIC /:id routes) ---
// ==========================================================

// === GET MY SHIPMENTS (FOR CUSTOMERS/SUPPLIERS) ===
// Endpoint: GET /api/shipments/my-shipments
router.get("/my-shipments", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const result = await db.query(
      `SELECT
        id,
        tracking_id,
        destination,
        supplier_name,
        status
      FROM shipments
      WHERE requester_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting my-shipments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === GET SHIPMENTS ASSIGNED TO ME (FOR SUPPLIERS) ===
// Endpoint: GET /api/shipments/assigned
router.get("/assigned", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const userResult = await db.query(
      "SELECT fullname FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const supplierName = userResult.rows[0].fullname;

    const result = await db.query(
      `SELECT
        id,
        tracking_id,
        requester_name,
        destination,
        status
      FROM shipments
      WHERE supplier_name ILIKE $1
      ORDER BY created_at DESC`,
      [supplierName]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting assigned shipments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === GET ALL AVAILABLE JOBS (FOR TRANSPORTERS) ===
// Endpoint: GET /api/shipments/available
router.get("/available", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        id,
        tracking_id,
        origin,
        destination,
        status
      FROM shipments
      WHERE status = 'Pending' AND transporter_id IS NULL
      ORDER BY created_at`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting available jobs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === GET MY ASSIGNED JOBS (FOR TRANSPORTERS) ===
// Endpoint: GET /api/shipments/my-active
router.get("/my-active", async (req, res) => {
  try {
    const { id: transporterId } = req.user;
    const result = await db.query(
      `SELECT
        id,
        tracking_id,
        origin,
        destination,
        status
      FROM shipments
      WHERE transporter_id = $1
      ORDER BY status ASC, created_at DESC`,
      [transporterId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting my active jobs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================================
// --- GENERIC /:id ROUTES (MUST BE LAST) ---
// ==========================================================

// === GET A SINGLE SHIPMENT BY ID (FOR MODALS) ===
// Endpoint: GET /api/shipments/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM shipments WHERE id = $1`, [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getting single shipment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === DELETE A SHIPMENT (ADMIN ONLY) ===
// Endpoint: DELETE /api/shipments/:id
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM shipments WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.status(200).json({ message: "Shipment deleted successfully" });
  } catch (err) {
    console.error("Error deleting shipment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === ACCEPT A JOB (FOR TRANSPORTERS) ===
// Endpoint: PATCH /api/shipments/:id/accept
router.patch("/:id/accept", async (req, res) => {
  try {
    const { id: shipmentId } = req.params;
    const { id: transporterId } = req.user; // Get logged-in transporter's ID

    // Update the shipment: set transporter_id, status, AND accepted_at
    const result = await db.query(
      `UPDATE shipments 
       SET 
         transporter_id = $1,
         status = 'In Transit',
         accepted_at = CURRENT_TIMESTAMP
       WHERE 
         id = $2 AND status = 'Pending' AND transporter_id IS NULL
       RETURNING id, status`,
      [transporterId, shipmentId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Job already taken or does not exist." });
    }

    res
      .status(200)
      .json({ message: "Job accepted!", shipment: result.rows[0] });
  } catch (err) {
    // <-- ADDED THE { HERE
    console.error("Error accepting job:", err);
    res.status(500).json({ message: "Server error" });
  } // <-- ADDED THE } HERE
});

// ... (This is after your GET /my-active route)

// vvv REPLACE THIS ENTIRE BLOCK vvv
// === UPDATE A JOB'S STATUS (FOR TRANSPORTERS) ===
// Endpoint: PATCH /api/shipments/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id: shipmentId } = req.params;
    const { id: transporterId } = req.user;
    const { newStatus } = req.body; // e.g., "In Transit" or "Delivered"

    if (!newStatus) {
      return res.status(400).json({ message: "newStatus is required." });
    }

    // --- NEW DYNAMIC QUERY ---
    // We'll build the query to conditionally set the timestamp
    let updateQuery = `UPDATE shipments SET status = $1`;
    let queryParams = [newStatus, shipmentId, transporterId];

    if (newStatus === "Delivered") {
      // If marked as Delivered, set the timestamp
      updateQuery += `, delivered_at = CURRENT_TIMESTAMP`;
    } else {
      // If set back to "In Transit", clear the timestamp
      updateQuery += `, delivered_at = NULL`;
    }

    updateQuery += ` WHERE id = $2 AND transporter_id = $3
                     RETURNING id, status`;
    // --- END DYNAMIC QUERY ---

    const result = await db.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res
        .status(403)
        .json({
          message: "Update failed. Job not found or you are not authorized.",
        });
    }

    res
      .status(200)
      .json({ message: "Status updated!", shipment: result.rows[0] });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ^^^ END OF REPLACEMENT ^^^

// ...

module.exports = router;
