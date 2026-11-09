import db from "../db.js";

async function requireAdmin(req, res, next) {
  try {
    // Check whether the user has an active session.
    if (!req.session.userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    // Retrieve the user's current role from the database.
    const result = await db.query(
      `SELECT role
       FROM users
       WHERE user_id = $1`,
      [req.session.userId],
    );

    const user = result.rows[0];

    // Handle deleted or unavailable accounts.
    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    // Only administrators can continue.
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      message: "Unable to verify administrator permissions.",
    });
  }
}

export default requireAdmin;