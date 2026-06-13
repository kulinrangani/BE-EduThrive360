import { Quiz } from "../models/Quiz.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { Question } from "../models/Question.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Result } from "../models/Result.js";
import { Organization } from "../models/Organization.js";
import { AppError } from "../utils/errors.js";
import { calculateAndSaveResult } from "./scoring.service.js";

function requesterOrgId(requester) {
  return requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
}

function sanitizeQuestionForPlay(q) {
  const json = q.toJSON ? q.toJSON() : { ...q };
  delete json.factorWeight;
  return json;
}

async function loadPublishedQuizTree(quizId, organizationId) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    organizationId,
    status: "published",
  });
  if (!quiz) throw new AppError(404, "Published quiz not found");

  const groups = await QuestionGroup.find({ quizId }).sort({ order: 1, createdAt: 1 });
  const questions = await Question.find({ quizId }).sort({ order: 1, createdAt: 1 });

  if (groups.length === 0 || questions.length === 0) {
    throw new AppError(400, "Quiz is not ready for attempts");
  }

  const quizJson = quiz.toJSON();
  quizJson.groups = groups.map((g) => {
    const gJson = g.toJSON();
    gJson.questions = questions
      .filter((q) => q.groupId.toString() === g._id.toString())
      .map(sanitizeQuestionForPlay);
    return gJson;
  });

  return { quiz, quizJson, groups, questions };
}

export async function listPublishedQuizzes(requester) {
  if (requester.role !== "user") {
    throw new AppError(403, "Only end-users can browse published quizzes");
  }

  const orgId = requesterOrgId(requester);
  if (!orgId) throw new AppError(400, "No organization linked to this account");

  const org = await Organization.findById(orgId);
  if (!org || org.isDeleted || org.status === false) {
    throw new AppError(403, "Organization is not available");
  }


  const quizzes = await Quiz.find({
    organizationId: orgId,
    status: "published",
  }).sort({ updatedAt: -1 });

  return quizzes.map((q) => q.toJSON());
}

export async function getPublishedQuizForPlay(quizId, requester) {
  if (requester.role !== "user") {
    throw new AppError(403, "Only end-users can take quizzes");
  }

  const orgId = requesterOrgId(requester);
  if (!orgId) throw new AppError(400, "No organization linked to this account");

  const { quizJson } = await loadPublishedQuizTree(quizId, orgId);
  return quizJson;
}

export async function startAttempt(quizId, requester) {
  if (requester.role !== "user") {
    throw new AppError(403, "Only end-users can start quiz attempts");
  }

  const orgId = requesterOrgId(requester);
  if (!orgId) throw new AppError(400, "No organization linked to this account");

  await loadPublishedQuizTree(quizId, orgId);

  const existing = await QuizAttempt.findOne({
    userId: requester._id,
    quizId,
    status: "in_progress",
  });

  if (existing) {
    return existing.toJSON();
  }

  const attempt = await QuizAttempt.create({
    userId: requester._id,
    quizId,
    organizationId: orgId,
    answers: [],
    status: "in_progress",
    startedAt: new Date(),
  });

  return attempt.toJSON();
}

export async function getAttempt(attemptId, requester) {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new AppError(404, "Attempt not found");

  if (attempt.userId.toString() !== requester._id.toString()) {
    throw new AppError(403, "Cannot access this attempt");
  }

  return attempt.toJSON();
}

function mergeAnswers(existing, incoming) {
  const map = new Map(
    (existing ?? []).map((a) => [String(a.questionId), a.selectedValue]),
  );
  for (const a of incoming ?? []) {
    map.set(String(a.questionId), Number(a.selectedValue));
  }
  return [...map.entries()].map(([questionId, selectedValue]) => ({
    questionId,
    selectedValue,
  }));
}

export async function saveAttemptAnswers(attemptId, payload, requester) {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new AppError(404, "Attempt not found");

  if (attempt.userId.toString() !== requester._id.toString()) {
    throw new AppError(403, "Cannot access this attempt");
  }

  if (attempt.status === "completed") {
    throw new AppError(400, "Attempt is already completed");
  }

  const { quiz, questions } = await loadPublishedQuizTree(
    attempt.quizId,
    attempt.organizationId,
  );

  const questionIds = new Set(questions.map((q) => q._id.toString()));

  for (const a of payload.answers ?? []) {
    const qid = String(a.questionId);
    if (!questionIds.has(qid)) {
      throw new AppError(400, `Invalid question id: ${qid}`);
    }
    const value = Number(a.selectedValue);
    if (!Number.isFinite(value) || value < 1 || value > 4) {
      throw new AppError(400, "Answer value must be between 1 and 4");
    }
  }

  const merged = mergeAnswers(attempt.answers, payload.answers);

  attempt.answers = merged.map((a) => ({
    questionId: a.questionId,
    selectedValue: a.selectedValue,
  }));
  await attempt.save();

  return attempt.toJSON();
}

export async function submitAttempt(attemptId, requester) {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new AppError(404, "Attempt not found");

  if (attempt.userId.toString() !== requester._id.toString()) {
    throw new AppError(403, "Cannot access this attempt");
  }

  if (attempt.status === "completed") {
    const { getAttemptResult } = await import("./result.service.js");
    return getAttemptResult(attemptId, requester);
  }

  const { quiz, groups, questions } = await loadPublishedQuizTree(
    attempt.quizId,
    attempt.organizationId,
  );

  const allowPartial = quiz.settings?.allowPartialSubmission ?? false;
  const answerMap = new Map(
    attempt.answers.map((a) => [a.questionId.toString(), a.selectedValue]),
  );

  const unanswered = questions.filter((q) => !answerMap.has(q._id.toString()));

  if (!allowPartial && unanswered.length > 0) {
    throw new AppError(400, "All questions must be answered before submit", {
      unansweredCount: unanswered.length,
    });
  }

  const answers = attempt.answers.map((a) => ({
    questionId: a.questionId.toString(),
    selectedValue: a.selectedValue,
  }));

  const { result, scored } = await calculateAndSaveResult({
    quiz,
    groups: groups.map((g) => g.toJSON()),
    questions,
    answers,
    userId: requester._id,
    quizId: quiz._id,
    attemptId: attempt._id,
    organizationId: attempt.organizationId,
  });

  attempt.status = "completed";
  attempt.completedAt = new Date();
  attempt.resultId = result.id ?? result._id;
  await attempt.save();

  return {
    attempt: attempt.toJSON(),
    result,
    groupScores: scored.groupScores,
    riskLevel: scored.riskLevel,
    normalizedScore: scored.normalizedScore,
    totalScore: scored.totalScore,
  };
}
