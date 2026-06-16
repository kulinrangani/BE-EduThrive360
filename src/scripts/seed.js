import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const SALT_ROUNDS = 10;

async function seed() {
  await connectDB();

  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@em360.io";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Admin1234!";
  const fullName = process.env.SEED_SUPER_ADMIN_NAME ?? "Platform Admin";

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: "super_admin",
  });

  console.log(`Created super admin: ${email}`);
  console.log("Default password (change in production):", password);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
