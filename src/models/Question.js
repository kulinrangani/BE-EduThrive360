import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 1, max: 4 },
  },
  { _id: false },
);

const DEFAULT_OPTIONS = [
  { label: "Not At All True", value: 1 },
  { label: "A Little True", value: 2 },
  { label: "Pretty Much True", value: 3 },
  { label: "Very Much True", value: 4 },
];

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionGroup",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: { type: [optionSchema], default: () => [...DEFAULT_OPTIONS] },
    factorWeight: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

questionSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.quizId = ret.quizId?.toString?.() ?? ret.quizId;
    ret.groupId = ret.groupId?.toString?.() ?? ret.groupId;
    ret.organizationId = ret.organizationId?.toString?.() ?? ret.organizationId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Question = mongoose.model("Question", questionSchema);
export { DEFAULT_OPTIONS };
