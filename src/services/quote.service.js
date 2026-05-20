import { Quote } from "../models/Quote.js";

export const DEFAULT_MESSAGES = {
  High: "You are stronger than your current thoughts. It is okay to ask for help.",
  Medium: "Take one step at a time. Your feelings are valid.",
  Low: "Keep growing and believing in yourself. Your mindset creates your future.",
};

/**
 * Pick a quote for a result based on risk level and optional score band.
 * Prefers quiz-specific quotes, then org-wide quotes.
 */
export async function pickQuote({ organizationId, quizId, riskLevel, normalizedScore }) {
  const orgId = organizationId?.toString?.() ?? organizationId;
  const qid = quizId?.toString?.() ?? quizId;

  const candidates = await Quote.find({
    organizationId: orgId,
    riskLevel,
    $or: [{ quizId: qid }, { quizId: null }],
  }).sort({ quizId: -1, createdAt: 1 });

  const score = Number(normalizedScore);
  const inBand = (q) => {
    if (q.minScore != null && score < q.minScore) return false;
    if (q.maxScore != null && score > q.maxScore) return false;
    return true;
  };

  const matched = candidates.filter(inBand);
  const pool = matched.length > 0 ? matched : candidates;

  if (pool.length > 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
      message: pick.message,
      quoteId: pick._id.toString(),
      type: pick.type,
    };
  }

  return {
    message: DEFAULT_MESSAGES[riskLevel] ?? DEFAULT_MESSAGES.Medium,
    quoteId: null,
    type: riskLevel === "High" ? "support" : riskLevel === "Low" ? "motivation" : "support",
  };
}
