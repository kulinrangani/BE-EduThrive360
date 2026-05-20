import { classifyRiskFromRanges } from "./classifyRisk.js";
import { scoreGroup } from "./scoreGroup.js";

function questionId(q) {
  return q.id ?? q._id?.toString?.() ?? String(q._id);
}

function groupId(g) {
  return g.id ?? g._id?.toString?.() ?? String(g._id);
}

/**
 * Compute full quiz scores from groups, questions, answers, and quiz settings.
 *
 * @param {object} params
 * @param {object} params.quiz - quiz document (settings.scoringModel)
 * @param {object[]} params.groups
 * @param {object[]} params.questions
 * @param {{ questionId: string, selectedValue: number }[]} params.answers
 */
export function scoreQuiz({ quiz, groups, questions, answers }) {
  const answerByQuestionId = new Map(
    answers.map((a) => [String(a.questionId), Number(a.selectedValue)]),
  );

  const questionsByGroup = new Map();
  for (const q of questions) {
    const gid = String(q.groupId?.id ?? q.groupId);
    if (!questionsByGroup.has(gid)) questionsByGroup.set(gid, []);
    questionsByGroup.get(gid).push(q);
  }

  const groupScores = groups.map((group) => {
    const gid = groupId(group);
    const groupQuestions = questionsByGroup.get(gid) ?? [];
    return scoreGroup(group, groupQuestions, answerByQuestionId);
  });

  const scoringModel = quiz.settings?.scoringModel ?? "weighted";
  const { totalScore, normalizedScore } = aggregateScores(groupScores, groups, scoringModel);
  const riskLevel = classifyRiskFromRanges(normalizedScore);

  return {
    totalScore,
    normalizedScore,
    riskLevel,
    groupScores,
    scoringModel,
  };
}

function aggregateScores(groupScores, groups, scoringModel) {
  const withWeight = groupScores
    .map((gs, i) => ({
      ...gs,
      weight: Number(groups[i]?.weight ?? 0),
    }))
    .filter((gs) => gs.answeredCount > 0);

  if (withWeight.length === 0) {
    return { totalScore: 0, normalizedScore: 0 };
  }

  const totalWeight = withWeight.reduce((sum, g) => sum + g.weight, 0) || 1;

  if (scoringModel === "raw") {
    const totalScore =
      withWeight.reduce((sum, g) => sum + g.rawScore * g.weight, 0) / totalWeight;
    const normalizedScore = totalScore;
    return { totalScore: round(totalScore), normalizedScore: round(normalizedScore) };
  }

  if (scoringModel === "normalized") {
    const normalizedScore =
      withWeight.reduce((sum, g) => sum + g.normalizedScore * g.weight, 0) / totalWeight;
    return {
      totalScore: round(normalizedScore),
      normalizedScore: round(normalizedScore),
    };
  }

  // weighted (default): weighted average of direction-normalized group scores
  const normalizedScore =
    withWeight.reduce((sum, g) => sum + g.normalizedScore * g.weight, 0) / totalWeight;
  const totalScore =
    withWeight.reduce((sum, g) => sum + g.rawScore * g.weight, 0) / totalWeight;

  return {
    totalScore: round(totalScore),
    normalizedScore: round(normalizedScore),
  };
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

export { classifyRiskFromRanges } from "./classifyRisk.js";
export { scoreGroup } from "./scoreGroup.js";
