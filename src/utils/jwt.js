import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

export function signToken(payload) {
  const { jwtSecret } = getEnv();
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token) {
  const { jwtSecret } = getEnv();
  return jwt.verify(token, jwtSecret);
}
