import { randomBytes } from "crypto";
import { Organization } from "../models/Organization.js";

function slugPrefix(name) {
  const letters = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 4) || "ORG").padEnd(4, "X");
}

export async function generateUniqueOrgCode(name) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const code = `${slugPrefix(name)}-${suffix}`;
    const exists = await Organization.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique organization code");
}

export function normalizeOrgCode(input) {
  return String(input ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}
