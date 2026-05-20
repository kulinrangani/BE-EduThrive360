import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    type: {
      type: String,
      enum: ["motivation", "support", "warning"],
      default: "support",
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    minScore: { type: Number },
    maxScore: { type: Number },
  },
  { timestamps: true },
);

quoteSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.organizationId = ret.organizationId?.toString?.() ?? ret.organizationId;
    if (ret.quizId) ret.quizId = ret.quizId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Quote = mongoose.model("Quote", quoteSchema);
