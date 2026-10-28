import express from "express";
import bcrypt from "bcrypt";

import db from "../db.js";

const router = express.Router();

const saltRounds = 12;

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Please provide a valid username, email, and password.",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate username
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
      return res.status(400).json({
        message:
          "Username must be 3–30 characters and contain only letters, numbers, and underscores.",
      });
    }

    // Validate email
    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // Validate password
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    if (/\s/.test(password)) {
      return res.status(400).json({
        message: "Password must not contain whitespace.",
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id, username, email, created_at`,
      [normalizedUsername, normalizedEmail, passwordHash],
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    // PostgreSQL unique-constraint violation
    if (error.code === "23505") {
      return res.status(409).json({
        message: "That username or email is already registered.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "An unexpected error occurred. Please try again.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please provide your email and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user by email
    const result = await db.query(
      `SELECT user_id, username, email, password_hash
       FROM users
       WHERE LOWER(email) = $1`,
      [normalizedEmail],
    );

    const user = result.rows[0];

    // Check whether the user exists and the password matches
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Regenerate the session to prevent session fixation
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error);

        return res.status(500).json({
          message: "Unable to create a session. Please try again.",
        });
      }

      // Store the user's ID in the server-side session
      req.session.userId = user.user_id;

      // Save the session before responding
      req.session.save((error) => {
        if (error) {
          console.error("Session save error:", error);

          return res.status(500).json({
            message: "Unable to save your session. Please try again.",
          });
        }

        return res.status(200).json({
          message: "Login successful.",
          user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "An unexpected error occurred. Please try again.",
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    // Check whether the user has a session
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    // Retrieve the current user from the database
    const result = await db.query(
      `SELECT user_id, username, email
       FROM users
       WHERE user_id = $1`,
      [req.session.userId],
    );

    const user = result.rows[0];

    // Handle a user account that no longer exists
    if (!user) {
      return req.session.destroy(() => {
        res.status(401).json({
          message: "Not authenticated.",
        });
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Current-user error:", error);

    return res.status(500).json({
      message: "An unexpected error occurred. Please try again.",
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        message: "Unable to log out. Please try again.",
      });
    }

    res.clearCookie("sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful.",
    });
  });
});

export default router;
