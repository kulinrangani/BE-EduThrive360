import { Router } from "express";
import { getMongoStatus } from "../config/db.js";

const router = Router();

router.get("/health", (_req, res) => {
  const mongo = getMongoStatus();
  res.json({
    status: "ok",
    service: "em360-api",
    timestamp: new Date().toISOString(),
    mongo,
  });
});

export default router;
