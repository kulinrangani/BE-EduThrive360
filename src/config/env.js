export function getEnv() {
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/eduthrive360",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    corsOrigins,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
