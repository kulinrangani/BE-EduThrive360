import { scoreQuiz } from "../scoring-engine/index.js";
import { Result } from "../models/Result.js";
import { pickQuote } from "./quote.service.js";

/**
 * Run scoring engine and persist a Result document.
 */
export async function calculateAndSaveResult({
  quiz,
  groups,
  questions,
  answers,
  userId,
  quizId,
  attemptId,
  organizationId,
}) {
  const scored = scoreQuiz({ quiz, groups, questions, answers });

  const quotePick = await pickQuote({
    organizationId,
    quizId,
    riskLevel: scored.riskLevel,
    normalizedScore: scored.normalizedScore,
  });

  const result = await Result.create({
    userId,
    quizId,
    attemptId,
    organizationId,
    totalScore: scored.totalScore,
    normalizedScore: scored.normalizedScore,
    riskLevel: scored.riskLevel,
    groupScores: scored.groupScores.map((g) => ({
      groupId: g.groupId,
      groupName: g.groupName,
      rawScore: g.rawScore,
      normalizedScore: g.normalizedScore,
      riskLevel: g.riskLevel,
    })),
    scoringModel: scored.scoringModel,
    quote: quotePick.message,
    quoteId: quotePick.quoteId,
    quoteType: quotePick.type,
  });

  const resultJson = result.toJSON();
  return { result: resultJson, scored };
}

export async function getResultByAttemptId(attemptId) {
  return Result.findOne({ attemptId });
}
