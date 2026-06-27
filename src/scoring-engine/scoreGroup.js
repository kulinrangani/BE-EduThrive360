import { classifyRiskFromRanges } from "./classifyRisk.js";

function questionId(q) {
  return q.id ?? q._id?.toString?.() ?? String(q._id);
}

/**
 * @param {object} group - { type, scoringMethod, weight, riskRanges }
 * @param {object[]} questions - questions in this group
 * @param {Map<string, number>} answerByQuestionId - questionId -> selectedValue (1-4)
 */
export function scoreGroup(group, questions, answerByQuestionId) {
  const entries = [];

  for (const question of questions) {
    const qid = questionId(question);
    const value = answerByQuestionId.get(qid);
    if (value == null || !Number.isFinite(value)) continue;

    const weight = Number(question.factorWeight ?? 1);
    entries.push({
      value: Number(value),
      weight: weight > 0 ? weight : 1,
    });
  }

  if (entries.length === 0) {
    return {
      groupId: group.id ?? group._id?.toString(),
      groupName: group.name,
      rawScore: 0,
      normalizedScore: 0,
      riskLevel: classifyRiskFromRanges(0, group.riskRanges),
      answeredCount: 0,
    };
  }

  const useWeightedQuestions = entries.some((e) => e.weight !== 1);
  let rawScore;

  if (group.scoringMethod === "sum") {
    rawScore = entries.reduce((sum, e) => {
      const contribution = useWeightedQuestions ? e.value * e.weight : e.value;
      return sum + contribution;
    }, 0);
  } else {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    const weightedSum = entries.reduce(
      (sum, e) => sum + (useWeightedQuestions ? e.value * e.weight : e.value),
      0,
    );
    rawScore = useWeightedQuestions
      ? weightedSum / totalWeight
      : weightedSum / entries.length;
  }

  let normalizedScore = rawScore;
  if (group.type === "negative") {
    normalizedScore = 5 - rawScore;
  }

  const riskLevel = classifyRiskFromRanges(normalizedScore, group.riskRanges);

  return {
    groupId: group.id ?? group._id?.toString(),
    groupName: group.name,
    rawScore: round(rawScore),
    normalizedScore: round(normalizedScore),
    riskLevel,
    answeredCount: entries.length,
  };
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
