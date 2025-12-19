import mongoose from "mongoose";

// Expense schema - for tracking shared expenses
const expenseSchema = new mongoose.Schema(
  {
    // Group this expense belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    // Description of expense
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // Total amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Currency (optional, default INR)
    currency: {
      type: String,
      default: "INR",
    },
    // Who paid for this expense (single payer - legacy support)
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Multiple payers - who paid and how much each
    paidByMultiple: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Split type: equal, exact, percentage
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      required: true,
    },
    // Split details - who owes what
    splits: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        // For 'exact' split: the exact amount they owe
        // For 'equal' split: calculated equal share
        // For 'percentage' split: calculated from percentage
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        // Percentage (only used for percentage split)
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        // Whether this split has been settled
        isSettled: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Category of expense
    category: {
      type: String,
      enum: [
        "food",
        "transport",
        "accommodation",
        "entertainment",
        "shopping",
        "utilities",
        "other",
      ],
      default: "other",
    },
    // Date of expense
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    // Notes
    notes: {
      type: String,
      default: "",
    },
    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
expenseSchema.index({ group: 1, createdAt: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ "paidByMultiple.user": 1 });
expenseSchema.index({ "splits.user": 1 });

// Virtual to get all payers (supports both single and multiple)
expenseSchema.virtual("allPayers").get(function () {
  if (this.paidByMultiple && this.paidByMultiple.length > 0) {
    return this.paidByMultiple;
  }
  if (this.paidBy) {
    return [{ user: this.paidBy, amount: this.amount }];
  }
  return [];
});

// Pre-save middleware to calculate splits for equal type
expenseSchema.pre("save", function () {
  if (this.splitType === "equal" && this.splits.length > 0) {
    const equalShare = this.amount / this.splits.length;
    this.splits.forEach((split) => {
      split.amount = Math.round(equalShare * 100) / 100; // Round to 2 decimal places
    });
  }

  if (this.splitType === "percentage" && this.splits.length > 0) {
    this.splits.forEach((split) => {
      if (split.percentage) {
        split.amount = Math.round((this.amount * split.percentage) / 100 * 100) / 100;
      }
    });
  }
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
