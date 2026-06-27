import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { signToken } from "../utils/jwt.js";
import { findOrganizationByCode } from "./organization.service.js";

const SALT_ROUNDS = 10;
const ORG_POPULATE = "name type code status";

function toPublicUser(user) {
  return user.toJSON ? user.toJSON() : user;
}

function buildAuthResponse(user) {
  const publicUser = toPublicUser(user);
  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    organizationId:
      user.organizationId?._id?.toString() ?? user.organizationId?.toString() ?? null,
  });
  return { token, user: publicUser };
}

export async function registerUser(payload) {
  const {
    fullName,
    email,
    password,
    role: requestedRole,
    organizationId,
    organizationCode,
    memberType,
    age,
    gender,
  } = payload;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const superAdminCount = await User.countDocuments({ role: "super_admin" });
  let role = requestedRole ?? "user";

  if (role === "super_admin") {
    if (superAdminCount > 0) {
      throw new AppError(403, "Super admin already exists; use login instead");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: "super_admin",
      organizationId: null,
      memberType: null,
      age,
      gender,
    });

    const populated = await User.findById(user._id)
      .populate("organizationId", ORG_POPULATE)
      .select("-passwordHash");

    return buildAuthResponse(populated);
  }

  if (role === "user") {
    let resolvedOrgId = organizationId;

    if (organizationCode) {
      const org = await findOrganizationByCode(organizationCode);
      resolvedOrgId = org._id.toString();
    }

    if (!resolvedOrgId) {
      throw new AppError(400, "organizationCode is required");
    }

    if (!memberType) {
      throw new AppError(400, "memberType is required for end users");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
      organizationId: resolvedOrgId,
      memberType,
      age,
      gender,
    });

    const populated = await User.findById(user._id)
      .populate("organizationId", ORG_POPULATE)
      .select("-passwordHash");

    return buildAuthResponse(populated);
  }

  throw new AppError(
    400,
    "Staff accounts are created by your organization admin. Use sign in instead.",
  );
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .populate("organizationId", ORG_POPULATE);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status === "inactive") {
    throw new AppError(403, "Account is deactivated");
  }

  if (user.organizationId) {
    const orgId = user.organizationId?._id ?? user.organizationId;
    const { Organization } = await import("../models/Organization.js");
    const org = await Organization.findById(orgId).select("status isDeleted");
    if (!org || org.isDeleted) {
      throw new AppError(403, "This organization is no longer active");
    }
    if (org.status === false) {
      throw new AppError(403, "Organization is deactivated");
    }
  }


  user.passwordHash = undefined;
  return buildAuthResponse(user);
}

const resetTokens = new Map();

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { message: "If that email exists, reset instructions were sent." };
  }

  const token = `reset_${user._id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  resetTokens.set(token, {
    userId: user._id.toString(),
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  const payload = {
    message: "If that email exists, reset instructions were sent.",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.devResetToken = token;
    payload.devResetHint = "POST /auth/reset-password with { token, password }";
    console.info("[dev] Password reset token for", email, ":", token);
  }

  return payload;
}

export async function resetPassword(token, newPassword) {
  const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  const user = await User.findById(entry.userId);
  if (!user) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  resetTokens.delete(token);

  return { message: "Password updated. You can sign in now." };
}

export async function getProfile(userId) {
  const user = await User.findById(userId)
    .populate("organizationId", ORG_POPULATE)
    .select("-passwordHash");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return toPublicUser(user);
}

export async function updateProfile(userId, payload) {
  const { fullName, email, phoneNumber, avatarUrl, password } = payload;
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (fullName !== undefined) {
    user.fullName = fullName;
  }
  if (email !== undefined) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existing) {
      throw new AppError(409, "Email already in use");
    }
    user.email = email.toLowerCase();
  }
  if (phoneNumber !== undefined) {
    user.phoneNumber = phoneNumber;
  }
  if (avatarUrl !== undefined) {
    user.avatarUrl = avatarUrl;
  }
  if (password !== undefined) {
    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  await user.save();

  const populated = await User.findById(userId)
    .populate("organizationId", ORG_POPULATE)
    .select("-passwordHash");
  return toPublicUser(populated);
}
