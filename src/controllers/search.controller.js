import { Organization } from "../models/Organization.js";
import { Quiz } from "../models/Quiz.js";
import { User } from "../models/User.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/errors.js";

function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.message, err.details);
      }
      next(err);
    }
  };
}

export const globalSearch = handle(async (req, res) => {
  const query = req.query.q || "";
  if (!query.trim()) {
    return res.json({ results: [] });
  }

  const re = new RegExp(query.trim(), "i");

  const [orgs, quizzes, users, groups] = await Promise.all([
    Organization.find({ name: re, isDeleted: { $ne: true } }).limit(10),
    Quiz.find({ title: re, isDeleted: { $ne: true } }).populate("organizationId").limit(10),
    User.find({
      $or: [{ fullName: re }, { email: re }],
    }).limit(10),
    QuestionGroup.find({ name: re }).populate("quizId").limit(10),
  ]);

  const results = [];

  orgs.forEach((o) => {
    results.push({
      id: o._id.toString(),
      type: "organization",
      name: o.name,
      subtitle: `Organization · ${o.code || ""}`,
      link: `/organizations/${o._id}`,
    });
  });

  quizzes.forEach((q) => {
    results.push({
      id: q._id.toString(),
      type: "quiz",
      name: q.title,
      subtitle: `Quiz · ${q.organizationId?.name || "Global"}`,
      link: `/quizzes/${q._id}`,
    });
  });

  users.forEach((u) => {
    // Determine user role tag
    const roleLabels = {
      super_admin: "Super Admin",
      org_admin: "Org Admin",
      org_counselor: "Counselor",
      user: "Member",
    };
    results.push({
      id: u._id.toString(),
      type: "user",
      name: u.fullName,
      subtitle: `User · ${u.email} (${roleLabels[u.role] || u.role})`,
      link: `/users?search=${encodeURIComponent(u.fullName)}&tab=${u.role === "org_counselor" ? "counselors" : "members"}`,
    });
  });

  groups.forEach((g) => {
    if (g.quizId) {
      results.push({
        id: g._id.toString(),
        type: "category",
        name: g.name,
        subtitle: `Category · Quiz: ${g.quizId.title || ""}`,
        link: `/quizzes/${g.quizId._id || g.quizId}`,
      });
    }
  });

  res.json({ results });
});
