import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "org_admin", "org_counselor", "user"],
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    memberType: {
      type: String,
      enum: ["student", "employee"],
      default: null,
    },
    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

userSchema.index({ organizationId: 1, role: 1 });

userSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    if (ret.organizationId && typeof ret.organizationId === "object") {
      const o = ret.organizationId;
      const orgId = o._id?.toString() ?? o.id;
      const summary = {
        id: orgId,
        name: o.name,
        type: o.type,
      };
      if (ret.role === "org_admin" && o.code) {
        summary.code = o.code;
      }
      ret.organizationId = summary;
    } else if (ret.organizationId) {
      ret.organizationId = ret.organizationId.toString();
    }
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
