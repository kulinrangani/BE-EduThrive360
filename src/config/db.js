import mongoose from "mongoose";
import { getEnv } from "./env.js";

let isConnected = false;

export function getMongoStatus() {
  const state = mongoose.connection.readyState;
  const labels = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    readyState: state,
    status: labels[state] ?? "unknown",
    isConnected: state === 1,
  };
}

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const { mongodbUri } = getEnv();
  mongoose.connection.on("connected", () => {
    isConnected = true;
  });
  mongoose.connection.on("disconnected", () => {
    isConnected = false;
  });

  await mongoose.connect(mongodbUri);
  return mongoose.connection;
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
