const jwt = require("jsonwebtoken");

// This middleware checks if the user is logged in
const verifyToken = (req, res, next) => {
  // Get the token from the 'Authorization' header
  // The frontend will send this as "Bearer TOKEN_STRING"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info (id, email, role) to the request
    next(); // Move to the next function
  } catch (ex) {
    res.status(400).json({ message: "Invalid token." });
  }
};

// This middleware checks if the logged-in user is an 'admin'
const checkAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access forbidden. Admin role required." });
  }
  next(); // User is an admin, proceed to the API logic
};

module.exports = { verifyToken, checkAdmin };
