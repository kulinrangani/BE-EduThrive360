import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import { getEnv } from "./config/env.js";

const app = express();
const { corsOrigins } = getEnv();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(routes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  if (err?.statusCode) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
