import mongoose from "mongoose";

// Settlement schema - tracks payments made to settle balances
const settlementSchema = new mongoose.Schema(
  {
    // Group context
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    // User who paid (settled their debt)
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User who received the payment
    paidTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Amount settled
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Currency
    currency: {
      type: String,
      default: "INR",
    },
    // Payment method (optional)
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "other"],
      default: "other",
    },
    // Notes
    notes: {
      type: String,
      default: "",
    },
    // Settlement date
    settlementDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
settlementSchema.index({ group: 1, createdAt: -1 });
settlementSchema.index({ paidBy: 1 });
settlementSchema.index({ paidTo: 1 });

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
