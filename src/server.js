import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { getEnv } from "./config/env.js";

dotenv.config();

const { port } = getEnv();

async function start() {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/health`);
  });
}

start();
