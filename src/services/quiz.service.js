import { Quiz } from "../models/Quiz.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { Question } from "../models/Question.js";
import { Quote } from "../models/Quote.js";
import { Organization } from "../models/Organization.js";
import { AppError } from "../utils/errors.js";

function requesterOrgId(requester) {
  return requester.organizationId?._id?.toString() ?? requester.organizationId?.toString();
}

function resolveTargetOrgId(requester, organizationId) {
  if (requester.role === "super_admin") {
    if (!organizationId) {
      throw new AppError(400, "organizationId is required");
    }
    return organizationId;
  }
  const orgId = requesterOrgId(requester);
  if (!orgId) {
    throw new AppError(400, "No organization linked to this account");
  }
  if (organizationId && organizationId !== orgId) {
    throw new AppError(403, "Cannot access another organization");
  }
  return orgId;
}

async function assertOrgActive(orgId) {
  const org = await Organization.findById(orgId);
  if (!org || org.isDeleted) throw new AppError(404, "Organization not found");
  if (org.status === false) {
    throw new AppError(403, "Organization is inactive");
  }
  return org;
}

async function getQuizForRequester(quizId, requester) {
  const quiz = await Quiz.findById(quizId)
    .populate("organizationId", "name type")
    .populate("createdBy", "fullName email");
  if (!quiz || quiz.isDeleted) throw new AppError(404, "Quiz not found");

  const orgId = quiz.organizationId?._id?.toString() ?? quiz.organizationId?.toString();
  if (requester.role === "super_admin") return quiz;
  if (requesterOrgId(requester) !== orgId) {
    throw new AppError(403, "Cannot access this quiz");
  }
  return quiz;
}


async function syncQuizQuestionCount(quizId) {
  const count = await Question.countDocuments({ quizId });
  await Quiz.findByIdAndUpdate(quizId, { "settings.totalQuestions": count });
}

export async function listQuizzes(requester, query = {}) {
  const filter = { isDeleted: { $ne: true } };

  if (requester.role === "super_admin") {
    if (query.organizationId) filter.organizationId = query.organizationId;
  } else {
    filter.organizationId = resolveTargetOrgId(requester);
  }

  if (query.status) filter.status = query.status;

  const quizzes = await Quiz.find(filter)
    .populate("organizationId", "name type")
    .populate("createdBy", "fullName email")
    .sort({ updatedAt: -1 });

  return quizzes.map((q) => q.toJSON());
}

export async function createQuiz(payload, requester) {
  const orgId = resolveTargetOrgId(requester, payload.organizationId);
  await assertOrgActive(orgId);

  const quiz = await Quiz.create({
    organizationId: orgId,
    title: payload.title,
    description: payload.description ?? "",
    status: payload.status ?? "draft",
    settings: {
      scoringModel: payload.settings?.scoringModel ?? "weighted",
      allowPartialSubmission: payload.settings?.allowPartialSubmission ?? false,
      totalQuestions: 0,
      estimatedTime: payload.settings?.estimatedTime ?? 15,
    },
    createdBy: requester._id,
  });

  const populated = await Quiz.findById(quiz._id)
    .populate("organizationId", "name type")
    .populate("createdBy", "fullName email");

  return populated.toJSON();
}

export async function getQuizById(quizId, requester, { includeTree = false } = {}) {
  const quiz = await getQuizForRequester(quizId, requester);
  const json = quiz.toJSON();

  if (!includeTree) return json;

  const groups = await QuestionGroup.find({ quizId }).sort({ order: 1, createdAt: 1 });
  const questions = await Question.find({ quizId }).sort({ order: 1, createdAt: 1 });
  const quotes = await Quote.find({ quizId }).sort({ createdAt: 1 });

  json.groups = groups.map((g) => {
    const gJson = g.toJSON();
    gJson.questions = questions
      .filter((q) => q.groupId.toString() === g._id.toString())
      .map((q) => q.toJSON());
    return gJson;
  });
  json.quotes = quotes.map((q) => q.toJSON());
  return json;
}

export async function updateQuiz(quizId, payload, requester) {
  const quiz = await getQuizForRequester(quizId, requester);

  if (payload.title !== undefined) quiz.title = payload.title;
  if (payload.description !== undefined) quiz.description = payload.description;
  if (payload.status !== undefined) quiz.status = payload.status;
  if (payload.settings) {
    const current =
      typeof quiz.settings?.toObject === "function"
        ? quiz.settings.toObject()
        : { ...(quiz.settings ?? {}) };
    quiz.settings = { ...current, ...payload.settings };
    quiz.markModified("settings");
  }

  await quiz.save();
  await syncQuizQuestionCount(quiz._id);

  const populated = await Quiz.findById(quiz._id)
    .populate("organizationId", "name type")
    .populate("createdBy", "fullName email");

  return populated.toJSON();
}

export async function deleteQuiz(quizId, requester) {
  const quiz = await getQuizForRequester(quizId, requester);
  quiz.isDeleted = true;
  await quiz.save();
  return { deleted: true };
}


export async function listGroups(quizId, requester) {
  await getQuizForRequester(quizId, requester);
  const groups = await QuestionGroup.find({ quizId }).sort({ order: 1, createdAt: 1 });
  return groups.map((g) => g.toJSON());
}

export async function createGroup(quizId, payload, requester) {
  const quiz = await getQuizForRequester(quizId, requester);
  const orgId = quiz.organizationId?._id ?? quiz.organizationId;

  const group = await QuestionGroup.create({
    quizId: quiz._id,
    organizationId: orgId,
    name: payload.name,
    type: payload.type,
    weight: payload.weight ?? 0.5,
    scoringMethod: payload.scoringMethod ?? "average",
    riskRanges: payload.riskRanges ?? [],
    order: payload.order ?? 0,
  });

  return group.toJSON();
}

export async function updateGroup(quizId, groupId, payload, requester) {
  await getQuizForRequester(quizId, requester);
  const group = await QuestionGroup.findOne({ _id: groupId, quizId });
  if (!group) throw new AppError(404, "Question group not found");

  const fields = ["name", "type", "weight", "scoringMethod", "riskRanges", "order"];
  for (const key of fields) {
    if (payload[key] !== undefined) group[key] = payload[key];
  }
  await group.save();
  return group.toJSON();
}

export async function deleteGroup(quizId, groupId, requester) {
  await getQuizForRequester(quizId, requester);
  const group = await QuestionGroup.findOne({ _id: groupId, quizId });
  if (!group) throw new AppError(404, "Question group not found");

  await Question.deleteMany({ groupId: group._id });
  await QuestionGroup.deleteOne({ _id: group._id });
  await syncQuizQuestionCount(quizId);
  return { deleted: true };
}

export async function listQuestions(quizId, groupId, requester) {
  await getQuizForRequester(quizId, requester);
  const group = await QuestionGroup.findOne({ _id: groupId, quizId });
  if (!group) throw new AppError(404, "Question group not found");

  const questions = await Question.find({ quizId, groupId }).sort({ order: 1, createdAt: 1 });
  return questions.map((q) => q.toJSON());
}

export async function createQuestion(quizId, groupId, payload, requester) {
  const quiz = await getQuizForRequester(quizId, requester);
  const group = await QuestionGroup.findOne({ _id: groupId, quizId });
  if (!group) throw new AppError(404, "Question group not found");

  const orgId = quiz.organizationId?._id ?? quiz.organizationId;
  const question = await Question.create({
    quizId: quiz._id,
    groupId: group._id,
    organizationId: orgId,
    questionText: payload.questionText,
    options: payload.options,
    factorWeight: payload.factorWeight ?? 1,
    order: payload.order ?? 0,
  });

  await syncQuizQuestionCount(quiz._id);
  return question.toJSON();
}

export async function updateQuestion(quizId, groupId, questionId, payload, requester) {
  await getQuizForRequester(quizId, requester);
  const question = await Question.findOne({ _id: questionId, quizId, groupId });
  if (!question) throw new AppError(404, "Question not found");

  const fields = ["questionText", "options", "factorWeight", "order"];
  for (const key of fields) {
    if (payload[key] !== undefined) question[key] = payload[key];
  }
  await question.save();
  return question.toJSON();
}

export async function deleteQuestion(quizId, groupId, questionId, requester) {
  await getQuizForRequester(quizId, requester);
  const question = await Question.findOne({ _id: questionId, quizId, groupId });
  if (!question) throw new AppError(404, "Question not found");

  await Question.deleteOne({ _id: question._id });
  await syncQuizQuestionCount(quizId);
  return { deleted: true };
}

export async function listQuotes(requester, query = {}) {
  const filter = {};

  if (requester.role === "super_admin") {
    if (query.organizationId) filter.organizationId = query.organizationId;
  } else {
    filter.organizationId = resolveTargetOrgId(requester);
  }

  if (query.quizId) filter.quizId = query.quizId;

  const quotes = await Quote.find(filter).sort({ createdAt: -1 });
  return quotes.map((q) => q.toJSON());
}

export async function createQuote(payload, requester) {
  const orgId = resolveTargetOrgId(requester, payload.organizationId);
  await assertOrgActive(orgId);

  if (payload.quizId) {
    await getQuizForRequester(payload.quizId, requester);
  }

  const quote = await Quote.create({
    organizationId: orgId,
    quizId: payload.quizId ?? null,
    type: payload.type ?? "support",
    riskLevel: payload.riskLevel,
    message: payload.message,
    minScore: payload.minScore,
    maxScore: payload.maxScore,
  });

  return quote.toJSON();
}

export async function updateQuote(quoteId, payload, requester) {
  const quote = await Quote.findById(quoteId);
  if (!quote) throw new AppError(404, "Quote not found");

  if (requester.role !== "super_admin") {
    if (requesterOrgId(requester) !== quote.organizationId.toString()) {
      throw new AppError(403, "Cannot access this quote");
    }
  }

  const fields = ["type", "riskLevel", "message", "minScore", "maxScore", "quizId"];
  for (const key of fields) {
    if (payload[key] !== undefined) quote[key] = payload[key];
  }
  await quote.save();
  return quote.toJSON();
}

export async function deleteQuote(quoteId, requester) {
  const quote = await Quote.findById(quoteId);
  if (!quote) throw new AppError(404, "Quote not found");

  if (requester.role !== "super_admin") {
    if (requesterOrgId(requester) !== quote.organizationId.toString()) {
      throw new AppError(403, "Cannot access this quote");
    }
  }

  await Quote.deleteOne({ _id: quote._id });
  return { deleted: true };
}
