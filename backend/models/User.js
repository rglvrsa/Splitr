import mongoose from "mongoose";

// User schema - syncs with Clerk authentication
const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // Removed unique: true since clerkId is already unique
      // This prevents duplicate key errors when syncing users
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // Groups user belongs to
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
  },
  { timestamps: true }
);

// Virtual for getting initials
userSchema.virtual("initials").get(function () {
  const first = this.firstName?.charAt(0) || "";
  const last = this.lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || this.email?.charAt(0).toUpperCase();
});

const User = mongoose.model("User", userSchema);

export default User;
