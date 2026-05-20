import { Result } from "../models/Result.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Quiz } from "../models/Quiz.js";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { AppError } from "../utils/errors.js";

function resolveOrgScope(requester, queryOrgId) {
  if (requester.role === "super_admin") {
    return queryOrgId ?? null;
  }
  if (requester.role === "org_admin" || requester.role === "org_counselor") {
    const orgId =
      requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
    if (!orgId) throw new AppError(400, "No organization linked");
    return orgId;
  }
  throw new AppError(403, "Insufficient permissions");
}

function buildMatch(organizationId) {
  const match = {};
  if (organizationId) match.organizationId = organizationId;
  return match;
}

export async function getOverallAnalytics(requester, query = {}) {
  const organizationId = resolveOrgScope(requester, query.organizationId);
  const match = buildMatch(organizationId);

  const [
    orgCount,
    memberCount,
    quizCount,
    attemptStats,
    riskAgg,
    recentAttempts,
  ] = await Promise.all([
    organizationId
      ? Organization.countDocuments({ _id: organizationId })
      : Organization.countDocuments({ status: { $ne: "archived" } }),
    User.countDocuments({
      ...match,
      role: "user",
      status: { $ne: "inactive" },
    }),
    Quiz.countDocuments({
      ...match,
      status: "published",
    }),
    QuizAttempt.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Result.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
        },
      },
    ]),
    QuizAttempt.find({ ...match, status: "completed" })
      .sort({ completedAt: -1 })
      .limit(8)
      .populate("userId", "fullName email memberType")
      .populate("quizId", "title"),
  ]);

  const attemptsByStatus = Object.fromEntries(
    attemptStats.map((s) => [s._id, s.count]),
  );

  const riskDistribution = { Low: 0, Medium: 0, High: 0 };
  for (const r of riskAgg) {
    if (r._id) riskDistribution[r._id] = r.count;
  }

  const totalResults = Object.values(riskDistribution).reduce((a, b) => a + b, 0);

  return {
    scope: organizationId ? "organization" : "platform",
    organizationId: organizationId ?? null,
    organizations: organizationId ? 1 : orgCount,
    members: memberCount,
    publishedQuizzes: quizCount,
    attempts: {
      total: Object.values(attemptsByStatus).reduce((a, b) => a + b, 0),
      inProgress: attemptsByStatus.in_progress ?? 0,
      completed: attemptsByStatus.completed ?? 0,
    },
    results: {
      total: totalResults,
      riskDistribution,
    },
    recentActivity: recentAttempts.map((a) => ({
      attemptId: a._id.toString(),
      user: a.userId?.fullName ?? "Unknown",
      memberType: a.userId?.memberType,
      quizTitle: a.quizId?.title ?? "Quiz",
      completedAt: a.completedAt,
    })),
  };
}

export async function getGroupWiseAnalytics(requester, query = {}) {
  const organizationId = resolveOrgScope(requester, query.organizationId);
  const match = buildMatch(organizationId);

  const pipeline = [
    { $match: match },
    { $unwind: "$groupScores" },
    {
      $group: {
        _id: {
          groupId: "$groupScores.groupId",
          groupName: "$groupScores.groupName",
        },
        avgNormalized: { $avg: "$groupScores.normalizedScore" },
        avgRaw: { $avg: "$groupScores.rawScore" },
        count: { $sum: 1 },
        riskCounts: { $push: "$groupScores.riskLevel" },
      },
    },
    { $sort: { "_id.groupName": 1 } },
  ];

  const groups = await Result.aggregate(pipeline);

  return groups.map((g) => {
    const riskBreakdown = { Low: 0, Medium: 0, High: 0 };
    for (const r of g.riskCounts ?? []) {
      if (r) riskBreakdown[r] = (riskBreakdown[r] ?? 0) + 1;
    }
    return {
      groupId: g._id.groupId?.toString?.() ?? g._id.groupId,
      groupName: g._id.groupName ?? "Group",
      resultCount: g.count,
      avgNormalizedScore: Number(g.avgNormalized?.toFixed(2) ?? 0),
      avgRawScore: Number(g.avgRaw?.toFixed(2) ?? 0),
      riskBreakdown,
    };
  });
}

export async function getHighRiskUsers(requester, query = {}) {
  const organizationId = resolveOrgScope(requester, query.organizationId);
  const match = buildMatch(organizationId);
  const limit = Math.min(Number(query.limit) || 25, 50);

  const latestPerUser = await Result.aggregate([
    { $match: { ...match, riskLevel: { $in: ["High", "Medium"] } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        latest: { $first: "$$ROOT" },
      },
    },
    { $limit: limit },
  ]);

  const userIds = latestPerUser.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select(
    "fullName email memberType organizationId",
  );
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const orgIds = [
    ...new Set(
      users
        .map((u) => u.organizationId?.toString())
        .filter(Boolean),
    ),
  ];
  const orgs = await Organization.find({ _id: { $in: orgIds } }).select("name type");
  const orgMap = new Map(orgs.map((o) => [o._id.toString(), o]));

  return latestPerUser.map((row) => {
    const result = row.latest;
    const user = userMap.get(row._id.toString());
    const org = user?.organizationId
      ? orgMap.get(user.organizationId.toString())
      : null;
    return {
      userId: row._id.toString(),
      fullName: user?.fullName ?? "Unknown",
      email: user?.email,
      memberType: user?.memberType,
      organizationName: org?.name,
      organizationType: org?.type,
      riskLevel: result.riskLevel,
      normalizedScore: result.normalizedScore,
      quizId: result.quizId?.toString?.() ?? result.quizId,
      resultId: result._id.toString(),
      createdAt: result.createdAt,
    };
  });
}
