import mongoose from "mongoose";

const moodCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // 1 = Very Stressed/Low, 5 = Excellent/High Energy
    },
    note: {
      type: String,
      trim: true,
      maxLength: 500,
    },
  },
  { timestamps: true }
);

moodCheckInSchema.index({ userId: 1, createdAt: -1 });

moodCheckInSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const MoodCheckIn = mongoose.model("MoodCheckIn", moodCheckInSchema);
