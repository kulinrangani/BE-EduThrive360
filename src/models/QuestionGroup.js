import mongoose from "mongoose";

const riskRangeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false },
);

const questionGroupSchema = new mongoose.Schema(
  {
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
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
    },
    weight: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
    scoringMethod: {
      type: String,
      enum: ["average", "sum"],
      default: "average",
    },
    riskRanges: { type: [riskRangeSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

questionGroupSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.quizId = ret.quizId?.toString?.() ?? ret.quizId;
    ret.organizationId = ret.organizationId?.toString?.() ?? ret.organizationId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const QuestionGroup = mongoose.model("QuestionGroup", questionGroupSchema);
