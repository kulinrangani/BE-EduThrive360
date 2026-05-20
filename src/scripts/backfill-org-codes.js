import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Organization } from "../models/Organization.js";
import { generateUniqueOrgCode } from "../utils/orgCode.js";

async function backfill() {
  await connectDB();
  const orgs = await Organization.find({ $or: [{ code: null }, { code: "" }, { code: { $exists: false } }] });
  const missing = orgs.length
    ? orgs
    : await Organization.find({ code: { $exists: false } });

  const all = await Organization.find({});
  let updated = 0;
  for (const org of all) {
    if (org.code) continue;
    org.code = await generateUniqueOrgCode(org.name);
    await org.save();
    updated += 1;
    console.log(`Code for ${org.name}: ${org.code}`);
  }
  console.log(updated ? `Backfilled ${updated} organizations` : "All organizations already have codes");
  process.exit(0);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
