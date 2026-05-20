import mongoose from "mongoose";

const groupScoreSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionGroup", required: true },
    groupName: { type: String, trim: true },
    rawScore: { type: Number, required: true },
    normalizedScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizAttempt",
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    totalScore: { type: Number, required: true },
    normalizedScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    groupScores: { type: [groupScoreSchema], default: [] },
    scoringModel: { type: String, default: "weighted" },
    quote: { type: String, trim: true },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", default: null },
    quoteType: { type: String, enum: ["motivation", "support", "warning"], default: null },
  },
  { timestamps: true },
);

resultSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.quizId = ret.quizId?.toString?.() ?? ret.quizId;
    ret.userId = ret.userId?.toString?.() ?? ret.userId;
    ret.attemptId = ret.attemptId?.toString?.() ?? ret.attemptId;
    ret.organizationId = ret.organizationId?.toString?.() ?? ret.organizationId;
    ret.attemptId = ret.attemptId?.toString?.() ?? ret.attemptId;
    ret.groupScores = (ret.groupScores ?? []).map((g) => ({
      groupId: g.groupId?.toString?.() ?? g.groupId,
      groupName: g.groupName,
      rawScore: g.rawScore,
      normalizedScore: g.normalizedScore,
      riskLevel: g.riskLevel,
    }));
    if (ret.quoteId) ret.quoteId = ret.quoteId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Result = mongoose.model("Result", resultSchema);
