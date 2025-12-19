import mongoose from "mongoose";

// Group schema - for organizing expenses
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // User who created the group
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Members of the group
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Total expenses in the group
    totalExpenses: {
      type: Number,
      default: 0,
    },
    // Group status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
groupSchema.index({ "members.user": 1 });
groupSchema.index({ createdBy: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
