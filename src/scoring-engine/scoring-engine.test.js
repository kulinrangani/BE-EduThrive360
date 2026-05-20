import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyRiskFromRanges } from "./classifyRisk.js";
import { scoreGroup } from "./scoreGroup.js";
import { scoreQuiz } from "./scoreQuiz.js";

describe("classifyRiskFromRanges", () => {
  it("uses custom ranges when provided", () => {
    const label = classifyRiskFromRanges(2.5, [
      { label: "Low", min: 3, max: 4 },
      { label: "High", min: 1, max: 2.5 },
    ]);
    assert.equal(label, "High");
  });

  it("falls back to default thresholds", () => {
    assert.equal(classifyRiskFromRanges(1.5), "High");
    assert.equal(classifyRiskFromRanges(2.5), "Medium");
    assert.equal(classifyRiskFromRanges(3.5), "Low");
  });
});

describe("scoreGroup", () => {
  const group = {
    id: "g1",
    name: "SEHS-S",
    type: "positive",
    scoringMethod: "average",
    riskRanges: [
      { label: "Low", min: 3, max: 4 },
      { label: "High", min: 1, max: 2 },
    ],
  };

  const questions = [
    { id: "q1", factorWeight: 1 },
    { id: "q2", factorWeight: 1 },
  ];

  it("averages positive group answers", () => {
    const answers = new Map([
      ["q1", 4],
      ["q2", 4],
    ]);
    const result = scoreGroup(group, questions, answers);
    assert.equal(result.rawScore, 4);
    assert.equal(result.normalizedScore, 4);
    assert.equal(result.riskLevel, "Low");
  });

  it("inverts negative group scores", () => {
    const negGroup = { ...group, type: "negative" };
    const answers = new Map([
      ["q1", 4],
      ["q2", 4],
    ]);
    const result = scoreGroup(negGroup, questions, answers);
    assert.equal(result.rawScore, 4);
    assert.equal(result.normalizedScore, 1);
    assert.equal(result.riskLevel, "High");
  });
});

describe("scoreQuiz", () => {
  it("computes weighted final from two groups", () => {
    const quiz = { settings: { scoringModel: "weighted" } };
    const groups = [
      { id: "g1", name: "Positive", type: "positive", weight: 0.6, scoringMethod: "average", riskRanges: [] },
      { id: "g2", name: "Negative", type: "negative", weight: 0.4, scoringMethod: "average", riskRanges: [] },
    ];
    const questions = [
      { id: "q1", groupId: "g1", factorWeight: 1 },
      { id: "q2", groupId: "g2", factorWeight: 1 },
    ];
    const answers = [
      { questionId: "q1", selectedValue: 4 },
      { questionId: "q2", selectedValue: 4 },
    ];

    const result = scoreQuiz({ quiz, groups, questions, answers });
    assert.equal(result.groupScores.length, 2);
    assert.ok(result.normalizedScore > 0);
    assert.ok(["Low", "Medium", "High"].includes(result.riskLevel));
  });
});
