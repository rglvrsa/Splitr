import mongoose from "mongoose";

// Balance schema - simplified balance tracking between users
// This tracks the net balance between two users in a group
const balanceSchema = new mongoose.Schema(
  {
    // Group context
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    // User who owes money
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User who is owed money
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Net amount owed (positive means fromUser owes toUser)
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    // Currency
    currency: {
      type: String,
      default: "INR",
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique balance record per user pair per group
balanceSchema.index({ group: 1, fromUser: 1, toUser: 1 }, { unique: true });

// Index for quick lookups
balanceSchema.index({ fromUser: 1 });
balanceSchema.index({ toUser: 1 });

// Static method to update balance between two users
balanceSchema.statics.updateBalance = async function (
  groupId,
  fromUserId,
  toUserId,
  amount
) {
  // Ensure consistent ordering (smaller ID first) to avoid duplicates
  const [user1, user2] =
    fromUserId.toString() < toUserId.toString()
      ? [fromUserId, toUserId]
      : [toUserId, fromUserId];

  const isReversed = fromUserId.toString() !== user1.toString();
  const adjustedAmount = isReversed ? -amount : amount;

  // Find or create balance record
  let balance = await this.findOne({
    group: groupId,
    fromUser: user1,
    toUser: user2,
  });

  if (!balance) {
    balance = new this({
      group: groupId,
      fromUser: user1,
      toUser: user2,
      amount: adjustedAmount,
    });
  } else {
    balance.amount += adjustedAmount;
  }

  // If balance is 0 or very close to 0, we can delete the record
  if (Math.abs(balance.amount) < 0.01) {
    if (balance._id) {
      await this.findByIdAndDelete(balance._id);
    }
    return null;
  }

  await balance.save();
  return balance;
};

// Static method to get all balances for a user
balanceSchema.statics.getUserBalances = async function (userId) {
  const owes = await this.find({ fromUser: userId, amount: { $gt: 0 } })
    .populate("toUser", "fullName email imageUrl")
    .populate("group", "name");

  const owed = await this.find({ toUser: userId, amount: { $gt: 0 } })
    .populate("fromUser", "fullName email imageUrl")
    .populate("group", "name");

  // Also check reverse (where user is toUser but amount is negative)
  const owesReverse = await this.find({ toUser: userId, amount: { $lt: 0 } })
    .populate("fromUser", "fullName email imageUrl")
    .populate("group", "name");

  const owedReverse = await this.find({ fromUser: userId, amount: { $lt: 0 } })
    .populate("toUser", "fullName email imageUrl")
    .populate("group", "name");

  return {
    youOwe: [
      ...owes.map((b) => ({
        user: b.toUser,
        group: b.group,
        amount: b.amount,
      })),
      ...owesReverse.map((b) => ({
        user: b.fromUser,
        group: b.group,
        amount: Math.abs(b.amount),
      })),
    ],
    youAreOwed: [
      ...owed.map((b) => ({
        user: b.fromUser,
        group: b.group,
        amount: b.amount,
      })),
      ...owedReverse.map((b) => ({
        user: b.toUser,
        group: b.group,
        amount: Math.abs(b.amount),
      })),
    ],
  };
};

const Balance = mongoose.model("Balance", balanceSchema);

export default Balance;
