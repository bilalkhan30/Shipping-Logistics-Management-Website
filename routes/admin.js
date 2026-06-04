const express = require("express");
const db = require("../db");
const { verifyToken, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// --- PROTECT ALL ROUTES IN THIS FILE ---
router.use(verifyToken);
router.use(checkAdmin);

// ==========================================================
// --- SPECIFIC ROUTES (MUST BE BEFORE GENERIC /:id routes) ---
// ==========================================================

// === GET ALL DASHBOARD SUMMARY DATA ===
// Endpoint: GET /api/admin/dashboard-summary
router.get("/dashboard-summary", async (req, res) => {
  try {
    // Query 1: Get all shipment stats
    const statsQuery = `
      SELECT
        COUNT(*) AS total_shipments,
        COUNT(CASE WHEN status = 'In Transit' THEN 1 END) AS in_transit,
        COUNT(CASE WHEN status = 'Delivered' THEN 1 END) AS delivered
      FROM shipments;
    `;

    // Query 2: Get all pending users
    const usersQuery = `
      SELECT id, fullname, email, phone, user_role 
      FROM users 
      WHERE status = 'pending' 
      ORDER BY created_at;
    `;

    // Run both queries
    const statsResult = await db.query(statsQuery);
    const usersResult = await db.query(usersQuery);

    // Combine into one response
    const summary = {
      stats: statsResult.rows[0],
      pendingUsers: usersResult.rows,
    };

    res.json(summary);
  } catch (err) {
    console.error("Error getting dashboard summary:", err.message);
    res.status(500).send("Server Error");
  }
});

// === GET ALL USERS (FOR MANAGE USERS PAGE) ===
// Endpoint: GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const loggedInAdminId = req.user.id;
    const result = await db.query(
      `SELECT id, fullname, email, phone, user_role, status 
      FROM users 
      WHERE id != $1 
      ORDER BY fullname`,
      [loggedInAdminId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting all users:", err.message);
    res.status(500).send("Server Error");
  }
});

// ...

// vvv REPLACE THIS ENTIRE BLOCK vvv
// === GET ALL TRANSPORTER ACTIVITY ===
// Endpoint: GET /api/admin/transporter-activity
router.get("/transporter-activity", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        s.id AS shipment_id,
        s.tracking_id,
        s.status,
        s.origin,
        s.destination,
        s.accepted_at,
        s.delivered_at, -- <-- ADDED THIS LINE
        u.fullname AS transporter_name,
        u.id AS transporter_id
      FROM shipments s
      JOIN users u ON s.transporter_id = u.id
      WHERE s.transporter_id IS NOT NULL
      AND (s.status = 'In Transit' OR s.status = 'Delivered')
      ORDER BY u.fullname, s.status DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting transporter activity:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ^^^ END OF REPLACEMENT ^^^

// ... (rest of your admin routes)

// ==========================================================
// --- GENERIC /:id ROUTES (MUST BE LAST) ---
// ==========================================================

// === APPROVE A USER ===
// Endpoint: PATCH /api/admin/users/:userId/approve
router.patch("/users/:userId/approve", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      "UPDATE users SET status = 'active' WHERE id = $1 RETURNING id, status",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User approved", user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === DENY / REMOVE A USER ===
// Endpoint: DELETE /api/admin/users/:userId
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete all shipments created by this user
    await client.query("DELETE FROM shipments WHERE requester_id = $1", [
      userId,
    ]);

    // 2. Un-assign any jobs they accepted as a transporter
    await client.query(
      `UPDATE shipments SET transporter_id = NULL, status = 'Pending' 
       WHERE transporter_id = $1 AND status = 'In Transit'`,
      [userId]
    );

    // 3. Now, delete the user themselves
    const deleteUserResult = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [userId]
    );

    if (deleteUserResult.rows.length === 0) {
      throw new Error("User not found");
    }

    // 4. Commit the transaction
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "User and all their shipments have been deleted." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting user:", err.message);

    if (err.message === "User not found") {
      res.status(404).json({ message: "User not found." }); // <-- THIS IS THE FIX
    } else {
      res.status(500).json({ message: "Server error during deletion." });
    }
  } finally {
    client.release();
  }
});

// ...
// === GET A SINGLE USER BY ID (ADMIN) ===
// Endpoint: GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Query 1: Get the user's profile
    const profileResult = await db.query(
      `SELECT fullname, email, phone, user_role, status, address, created_at 
       FROM users WHERE id = $1`,
      [id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Query 2: Get all shipments for this user
    const shipmentsResult = await db.query(
      `SELECT tracking_id, requester_name, origin, destination, status
       FROM shipments
       WHERE transporter_id = $1
       ORDER BY status, created_at DESC`,
      [id]
    );

    // Combine into one response object
    const responseData = {
      profile: profileResult.rows[0],
      shipments: shipmentsResult.rows,
    };

    res.json(responseData); // Send back the combined object
  } catch (err) {
    console.error("Error getting single user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ... (This is after all your other routes)

// vvv ADD THIS NEW BLOCK OF CODE vvv
// === GENERATE A SHIPMENT REPORT ===
// Endpoint: POST /api/admin/reports/shipments
router.post("/reports/shipments", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    // Adjust endDate to include the entire day
    // This makes the query inclusive of the end date
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query 1: Get the stats
    const statsQuery = `
      SELECT
        COUNT(*) AS total_shipments,
        COUNT(CASE WHEN status = 'Delivered' THEN 1 END) AS delivered,
        COUNT(CASE WHEN status = 'In Transit' THEN 1 END) AS in_transit
      FROM shipments
      WHERE created_at >= $1 AND created_at <= $2;
    `;

    // Query 2: Get the matching shipment rows
    const shipmentsQuery = `
      SELECT
        tracking_id,
        requester_name,
        status,
        created_at
      FROM shipments
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC;
    `;

    // Run both queries
    const statsResult = await db.query(statsQuery, [startDate, endOfDay]);
    const shipmentsResult = await db.query(shipmentsQuery, [
      startDate,
      endOfDay,
    ]);

    // Combine into one response
    const report = {
      stats: statsResult.rows[0],
      shipments: shipmentsResult.rows,
    };

    res.json(report);
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ^^^ END OF NEW BLOCK ^^^

module.exports = router;
