import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/errors.js";
import { generateUniqueOrgCode, normalizeOrgCode } from "../utils/orgCode.js";

const SALT_ROUNDS = 10;
const ORG_POPULATE = "name type code";

async function ensureOrganizationCode(org) {
  if (org.code) return org;
  org.code = await generateUniqueOrgCode(org.name);
  await org.save();
  return org;
}

function requesterOrgId(requester) {
  return requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
}

function canManageOrg(requester, organizationId) {
  if (requester.role === "super_admin") return true;
  if (requester.role === "org_admin") {
    return requesterOrgId(requester) === organizationId;
  }
  return false;
}

function canViewOrgMembers(requester, organizationId) {
  if (requester.role === "super_admin") return true;
  if (["org_admin", "org_counselor"].includes(requester.role)) {
    return requesterOrgId(requester) === organizationId;
  }
  return false;
}

export async function findOrganizationByCode(codeInput) {
  const code = normalizeOrgCode(codeInput);
  if (!code) {
    throw new AppError(400, "Organization code is required");
  }
  const org = await Organization.findOne({ code, isDeleted: { $ne: true } });
  if (!org) {
    throw new AppError(404, "Invalid organization code");
  }
  if (org.status === false) {
    throw new AppError(403, "This organization is no longer active");
  }
  return org;
}

export async function assertOrgNotArchived(orgId) {
  const org = await Organization.findById(orgId);
  if (!org || org.isDeleted) throw new AppError(404, "Organization not found");
  if (org.status === false) {
    throw new AppError(403, "Organization is inactive");
  }
  return org;
}


export async function createOrganization(payload) {
  const { name, type, settings, admin } = payload;

  if (!admin?.fullName || !admin?.email || !admin?.password) {
    throw new AppError(400, "Organization admin name, email, and password are required");
  }

  const existingAdmin = await User.findOne({ email: admin.email.toLowerCase() });
  if (existingAdmin) {
    throw new AppError(409, "Admin email already registered");
  }

  const code = await generateUniqueOrgCode(name);
  const org = await Organization.create({
    name,
    type,
    code,
    settings: settings ?? {},
  });

  try {
    const passwordHash = await bcrypt.hash(admin.password, SALT_ROUNDS);
    const adminUser = await User.create({
      fullName: admin.fullName,
      email: admin.email.toLowerCase(),
      passwordHash,
      role: "org_admin",
      organizationId: org._id,
    });

    const populated = await User.findById(adminUser._id)
      .populate("organizationId", ORG_POPULATE)
      .select("-passwordHash");

    return {
      organization: org.toJSON(),
      admin: populated.toJSON(),
    };
  } catch (err) {
    await Organization.deleteOne({ _id: org._id });
    throw err;
  }
}

export async function getMyOrganization(requester) {
  const orgId = requester.organizationId?._id ?? requester.organizationId;
  if (!orgId) {
    throw new AppError(400, "No organization linked to this account");
  }

  let org = await Organization.findById(orgId);
  if (!org || org.isDeleted) {
    throw new AppError(404, "Organization not found");
  }

  org = await ensureOrganizationCode(org);

  const memberCount = await User.countDocuments({ organizationId: orgId, role: "user" });
  const counselorCount = await User.countDocuments({
    organizationId: orgId,
    role: "org_counselor",
  });

  const json = org.toJSON();
  const showCode = requester.role === "org_admin";
  return {
    ...json,
    code: showCode ? json.code : undefined,
    stats: { members: memberCount, counselors: counselorCount },
  };
}

export async function getOrganizationById(id, requester) {
  let org = await Organization.findById(id);
  if (!org || org.isDeleted) {
    throw new AppError(404, "Organization not found");
  }


  org = await ensureOrganizationCode(org);

  if (requester.role === "org_admin") {
    const orgId = requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
    if (orgId !== id) {
      throw new AppError(403, "Cannot access another organization");
    }
  }

  const memberCount = await User.countDocuments({ organizationId: id, role: "user" });
  const counselorCount = await User.countDocuments({
    organizationId: id,
    role: "org_counselor",
  });
  const adminCount = await User.countDocuments({ organizationId: id, role: "org_admin" });

  const json = org.toJSON();
  const includeCode =
    requester.role === "super_admin" || requester.role === "org_admin";

  const detail = {
    ...json,
    code: includeCode ? json.code : undefined,
    stats: { members: memberCount, counselors: counselorCount, admins: adminCount },
  };

  if (requester.role === "super_admin") {
    const users = await User.find({ organizationId: id })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    detail.admins = users
      .filter((u) => u.role === "org_admin")
      .map((u) => u.toJSON());
    detail.counselors = users
      .filter((u) => u.role === "org_counselor")
      .map((u) => u.toJSON());
    detail.members = users
      .filter((u) => u.role === "user")
      .map((u) => u.toJSON());
  }

  return detail;
}

export async function updateOrganization(id, payload, requester) {
  if (requester.role !== "super_admin") {
    throw new AppError(403, "Insufficient permissions");
  }

  const org = await Organization.findById(id);
  if (!org || org.isDeleted) {
    throw new AppError(404, "Organization not found");
  }

  if (payload.name !== undefined) org.name = payload.name;
  if (payload.type !== undefined) org.type = payload.type;
  if (payload.settings !== undefined) {
    org.settings = { ...(org.settings ?? {}), ...payload.settings };
  }
  if (payload.status !== undefined) {
    if (typeof payload.status === "string") {
      org.status = payload.status === "active" || payload.status === "true";
    } else {
      org.status = Boolean(payload.status);
    }
  }

  await org.save();
  return org.toJSON();
}

export async function deleteOrganization(id, requester) {
  if (requester.role !== "super_admin") {
    throw new AppError(403, "Insufficient permissions");
  }
  const org = await Organization.findById(id);
  if (!org || org.isDeleted) {
    throw new AppError(404, "Organization not found");
  }
  org.isDeleted = true;
  await org.save();

  // Also soft-delete all quizzes under this organization
  const { Quiz } = await import("../models/Quiz.js");
  await Quiz.updateMany({ organizationId: org._id }, { $set: { isDeleted: true } });

  return { deleted: true };
}


export async function listOrganizations(requester, query = {}) {
  if (requester.role !== "super_admin") {
    throw new AppError(403, "Insufficient permissions");
  }

  const filter = { isDeleted: { $ne: true } };
  if (query.type) filter.type = query.type;
  if (query.status !== undefined) {
    if (query.status === "active" || query.status === "true" || query.status === true) {
      filter.status = true;
    } else if (query.status === "inactive" || query.status === "false" || query.status === false) {
      filter.status = false;
    }
  }
  if (query.search) {
    const re = new RegExp(query.search.trim(), "i");
    filter.$or = [{ name: re }, { code: re }];
  }

  const orgs = await Organization.find(filter).sort({ createdAt: -1 });
  const counts = await User.aggregate([
    { $match: { organizationId: { $ne: null } } },
    { $group: { _id: "$organizationId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const result = [];
  for (const org of orgs) {
    const hydrated = await ensureOrganizationCode(org);
    result.push({
      ...hydrated.toJSON(),
      memberCount: countMap[hydrated._id.toString()] ?? 0,
    });
  }
  return result;
}


export async function addMember(organizationId, payload, requester) {
  if (!canManageOrg(requester, organizationId)) {
    throw new AppError(403, "Cannot add members to this organization");
  }

  const org = await assertOrgNotArchived(organizationId);

  const role = payload.role ?? "user";
  if (!["org_counselor", "user"].includes(role)) {
    throw new AppError(400, "Role must be org_counselor or user");
  }

  if (role === "user" && !payload.memberType) {
    payload.memberType = org.type === "corporate" ? "employee" : "student";
  }

  if (role === "org_counselor" && payload.memberType) {
    throw new AppError(400, "memberType is not allowed for counselors");
  }

  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    passwordHash,
    role,
    organizationId,
    memberType: role === "user" ? payload.memberType : null,
    age: payload.age,
    gender: payload.gender,
  });

  const populated = await User.findById(user._id)
    .populate("organizationId", ORG_POPULATE)
    .select("-passwordHash");

  return populated.toJSON();
}

export async function listOrgMembers(organizationId, requester, query = {}) {
  if (!canViewOrgMembers(requester, organizationId)) {
    throw new AppError(403, "Insufficient permissions");
  }

  const filter = { organizationId };

  if (query.role) {
    filter.role = query.role;
  } else {
    filter.role = { $in: ["org_counselor", "user"] };
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  return users.map((u) => u.toJSON());
}

export async function getOrgMember(organizationId, userId, requester) {
  if (!canViewOrgMembers(requester, organizationId)) {
    throw new AppError(403, "Insufficient permissions");
  }

  const user = await User.findOne({
    _id: userId,
    organizationId,
    role: { $in: ["org_counselor", "user", "org_admin"] },
  }).select("-passwordHash");

  if (!user) {
    throw new AppError(404, "Member not found");
  }

  return user.toJSON();
}

export async function updateOrgMember(organizationId, userId, payload, requester) {
  if (!canManageOrg(requester, organizationId)) {
    throw new AppError(403, "Cannot update members in this organization");
  }

  await assertOrgNotArchived(organizationId);

  const user = await User.findOne({
    _id: userId,
    organizationId,
    role: { $in: ["org_counselor", "user"] },
  });

  if (!user) {
    throw new AppError(404, "Member not found");
  }

  if (payload.fullName !== undefined) user.fullName = payload.fullName;

  if (payload.email !== undefined) {
    const email = payload.email.toLowerCase();
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }
    user.email = email;
  }

  if (payload.status !== undefined) {
    user.status = payload.status;
  }

  if (payload.password) {
    user.passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }

  await user.save();

  const populated = await User.findById(user._id)
    .populate("organizationId", ORG_POPULATE)
    .select("-passwordHash");

  return populated.toJSON();
}

export async function deactivateOrgMember(organizationId, userId, requester) {
  return updateOrgMember(organizationId, userId, { status: "inactive" }, requester);
}

export async function deleteOrgMember(organizationId, userId, requester) {
  if (!canManageOrg(requester, organizationId)) {
    throw new AppError(403, "Cannot remove members from this organization");
  }

  const user = await User.findOne({
    _id: userId,
    organizationId,
    role: { $in: ["org_counselor", "user"] },
  });

  if (!user) {
    throw new AppError(404, "Member not found");
  }

  if (user.status === "inactive") {
    await User.deleteOne({ _id: user._id });
    return { deleted: true };
  }

  user.status = "inactive";
  await user.save();
  return user.toJSON();
}
