import { Result } from "../models/Result.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Quiz } from "../models/Quiz.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { pickQuote } from "./quote.service.js";

function requesterOrgId(requester) {
  return requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
}

async function enrichResult(resultDoc) {
  const json = resultDoc.toJSON ? resultDoc.toJSON() : resultDoc;
  const quiz = await Quiz.findById(json.quizId).select("title status");
  if (quiz) {
    json.quizTitle = quiz.title;
    json.quizStatus = quiz.status;
  }
  return json;
}

async function ensureQuoteOnResult(resultDoc) {
  if (resultDoc.quote) {
    return enrichResult(resultDoc);
  }

  const pick = await pickQuote({
    organizationId: resultDoc.organizationId,
    quizId: resultDoc.quizId,
    riskLevel: resultDoc.riskLevel,
    normalizedScore: resultDoc.normalizedScore,
  });

  resultDoc.quote = pick.message;
  resultDoc.quoteId = pick.quoteId;
  resultDoc.quoteType = pick.type;
  await resultDoc.save();

  return enrichResult(resultDoc);
}

export async function getAttemptResult(attemptId, requester) {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new AppError(404, "Attempt not found");

  if (requester.role === "user") {
    if (attempt.userId.toString() !== requester._id.toString()) {
      throw new AppError(403, "Cannot access this attempt");
    }
  } else if (requester.role === "org_admin" || requester.role === "org_counselor") {
    const orgId = requesterOrgId(requester);
    if (attempt.organizationId.toString() !== orgId) {
      throw new AppError(403, "Cannot access this attempt");
    }
  } else if (requester.role !== "super_admin") {
    throw new AppError(403, "Insufficient permissions");
  }

  if (attempt.status !== "completed" || !attempt.resultId) {
    throw new AppError(400, "Attempt is not completed yet");
  }

  const result = await Result.findById(attempt.resultId);
  if (!result) throw new AppError(404, "Result not found");

  const enriched = await ensureQuoteOnResult(result);
  return { attempt: attempt.toJSON(), result: enriched };
}

export async function listMyResults(requester, query = {}) {
  if (requester.role !== "user") {
    throw new AppError(403, "Only end-users can list their results");
  }

  const limit = Math.min(Number(query.limit) || 20, 50);
  const results = await Result.find({ userId: requester._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  const enriched = [];
  for (const r of results) {
    enriched.push(await ensureQuoteOnResult(r));
  }
  return enriched;
}

export async function getResultById(resultId, requester) {
  const result = await Result.findById(resultId);
  if (!result) throw new AppError(404, "Result not found");

  if (requester.role === "user") {
    if (result.userId.toString() !== requester._id.toString()) {
      throw new AppError(403, "Cannot access this result");
    }
  } else if (requester.role === "org_admin" || requester.role === "org_counselor") {
    const orgId = requesterOrgId(requester);
    if (result.organizationId.toString() !== orgId) {
      throw new AppError(403, "Cannot access this result");
    }
  } else if (requester.role !== "super_admin") {
    throw new AppError(403, "Insufficient permissions");
  }

  const enriched = await ensureQuoteOnResult(result);

  if (requester.role !== "user") {
    const member = await User.findById(result.userId).select(
      "fullName email memberType",
    );
    if (member) enriched.user = member.toJSON();
  }

  return enriched;
}

export async function listOrgResults(organizationId, requester, query = {}) {
  if (requester.role === "super_admin") {
    if (!organizationId) throw new AppError(400, "organizationId is required");
  } else if (requester.role === "org_admin" || requester.role === "org_counselor") {
    organizationId = requesterOrgId(requester);
    if (!organizationId) throw new AppError(400, "No organization linked");
  } else {
    throw new AppError(403, "Insufficient permissions");
  }

  const filter = { organizationId };
  if (query.userId) filter.userId = query.userId;
  if (query.quizId) filter.quizId = query.quizId;
  if (query.riskLevel) filter.riskLevel = query.riskLevel;

  const limit = Math.min(Number(query.limit) || 50, 100);
  const results = await Result.find(filter).sort({ createdAt: -1 }).limit(limit);

  const userIds = [...new Set(results.map((r) => r.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select("fullName email memberType");
  const userMap = new Map(users.map((u) => [u._id.toString(), u.toJSON()]));

  const rows = [];
  for (const r of results) {
    const json = await ensureQuoteOnResult(r);
    json.user = userMap.get(r.userId.toString()) ?? null;
    rows.push(json);
  }

  return rows;
}
