import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    settings: {
      scoringModel: {
        type: String,
        enum: ["weighted", "raw", "normalized"],
        default: "weighted",
      },
      allowPartialSubmission: { type: Boolean, default: false },
      totalQuestions: { type: Number, default: 0 },
      estimatedTime: { type: Number, default: 15 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

quizSchema.index({ organizationId: 1, status: 1 });

quizSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    if (ret.organizationId && typeof ret.organizationId === "object") {
      ret.organizationId = {
        id: ret.organizationId._id?.toString(),
        name: ret.organizationId.name,
        type: ret.organizationId.type,
      };
    } else if (ret.organizationId) {
      ret.organizationId = ret.organizationId.toString();
    }
    if (ret.createdBy && typeof ret.createdBy === "object") {
      ret.createdBy = {
        id: ret.createdBy._id?.toString(),
        fullName: ret.createdBy.fullName,
        email: ret.createdBy.email,
      };
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Quiz = mongoose.model("Quiz", quizSchema);
