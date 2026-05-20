import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedValue: { type: Number, required: true, min: 1, max: 4 },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
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
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    answers: { type: [answerSchema], default: [] },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
      default: null,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ userId: 1, quizId: 1, status: 1 });

quizAttemptSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.quizId = ret.quizId?.toString?.() ?? ret.quizId;
    ret.userId = ret.userId?.toString?.() ?? ret.userId;
    ret.organizationId = ret.organizationId?.toString?.() ?? ret.organizationId;
    ret.resultId = ret.resultId?.toString?.() ?? ret.resultId;
    ret.answers = (ret.answers ?? []).map((a) => ({
      questionId: a.questionId?.toString?.() ?? a.questionId,
      selectedValue: a.selectedValue,
    }));
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
