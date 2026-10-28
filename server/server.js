import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_routes.js";

import db from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const PgSession = connectPgSimple(session);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Ignite Sneaks API is running.",
  });
});

app.listen(port, () => {
  console.log(`Ignite Sneaks server running on port ${port}`);
});