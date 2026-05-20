import { User } from "../models/User.js";
import { sendError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, 401, "Authentication required");
  }

  try {
    const decoded = verifyToken(header.slice(7));
    const user = await User.findById(decoded.sub)
      .populate("organizationId", "name type")
      .select("-passwordHash");

    if (!user) {
      return sendError(res, 401, "Invalid token");
    }

    req.user = user;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "Insufficient permissions");
    }
    next();
  };
}
