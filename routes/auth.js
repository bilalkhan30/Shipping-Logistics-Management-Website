const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// === SIGNUP ===
// Endpoint: POST /api/auth/signup
// Matches your frontend js/signup.js
router.post("/signup", async (req, res) => {
  try {
    // Get data from the signup form
    const {
      fullname,
      email,
      phone,
      "user-role": userRole,
      password,
    } = req.body;

    // 1. Check if user already exists
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Save the new user to the database
    // Status defaults to 'pending' from the SQL table definition
    const newUser = await db.query(
      "INSERT INTO users (fullname, email, phone, user_role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, user_role, status",
      [fullname, email, phone, userRole, passwordHash]
    );

    // 4. Respond with success
    // The frontend already shows the "pending approval" message
    res.status(201).json({
      message:
        "Account created successfully! It is now pending admin approval.",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating account." });
  }
});

// === LOGIN ===
// Endpoint: POST /api/auth/login
// This replaces your mock login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const user = userResult.rows[0];

    // 2. Check if the user's account is 'active'
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Account is pending approval or inactive." });
    }

    // --- START OF DEBUG LOG (NEW) ---
    const hashFromDB = user.password_hash;
    console.log("Password from frontend:", password);
    console.log("Hash from database:", hashFromDB);
    console.log("Length of hash from DB:", hashFromDB.length); // NEW log
    // --- END OF DEBUG LOG ---

    // --- THE FIX ---
    // We will trim() the hash to remove any hidden spaces or newlines
    const trimmedHash = user.password_hash.trim();

    // Now we compare against the trimmed hash
    const isMatch = await bcrypt.compare(password, trimmedHash);
    console.log("Result of bcrypt.compare:", isMatch); // <-- ADD THIS LINE
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Create a JSON Web Token (JWT)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.user_role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d", // Token lasts for 1 day
    });

    // 5. Send the token and user info back to the frontend
    res.status(200).json({
      message: "Login successful!",
      token: token,
      userRole: user.user_role, // Send the role for frontend routing
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ... (This is after your /login route)

// vvv ADD THIS NEW BLOCK OF CODE vvv
// === CHANGE PASSWORD ===
// Endpoint: POST /api/auth/change-password
// This will be called by js/profile.js and js/my-profile.js
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    // Get the user's ID from their token
    const { id: userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    // 1. Get the user's current hash from the DB
    const userResult = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashFromDB = userResult.rows[0].password_hash.trim();

    // 2. Compare the "current password" from the form with the hash
    const isMatch = await bcrypt.compare(currentPassword, hashFromDB);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Update the password in the database
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      userId,
    ]);

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: "Server error while changing password." });
  }
});

// ... (This is after your /change-password route)

// ... (other imports)

// vvv REPLACE your old GET /me route with this vvv
// === GET MY OWN PROFILE INFO ===
// Endpoint: GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const result = await db.query(
      "SELECT fullname, email, phone, user_role, address FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ^^^ END OF REPLACEMENT ^^^

// vvv ADD THIS NEW PUT /me route vvv
// === UPDATE MY OWN PROFILE INFO ===
// Endpoint: PUT /api/auth/me
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { fullname, email, phone, address } = req.body;

    // Check if the new email is already taken by *another* user
    const emailCheck = await db.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, userId]
    );
    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account." });
    }

    // Update the user's profile
    const result = await db.query(
      `UPDATE users SET fullname = $1, email = $2, phone = $3, address = $4
       WHERE id = $5
       RETURNING fullname, email, phone, address`,
      [fullname, email, phone, address, userId]
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ^^^ END OF NEW ROUTE ^^^

module.exports = router;
