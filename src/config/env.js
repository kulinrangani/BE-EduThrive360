export function getEnv() {
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    mongodbUri: process.env.MONGODB_URI ?? "mongodb+srv://em360:HCKw2yohD0vJVoC9@em360.ylouneq.mongodb.net/em360?appName=EM360",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    corsOrigins,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
