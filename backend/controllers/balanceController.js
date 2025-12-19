import Balance from "../models/Balance.js";
import User from "../models/User.js";

// Get all balances for a user
export const getUserBalances = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const balances = await Balance.getUserBalances(user._id);

    // Calculate totals
    const totalYouOwe = balances.youOwe.reduce((sum, b) => sum + b.amount, 0);
    const totalYouAreOwed = balances.youAreOwed.reduce((sum, b) => sum + b.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        youOwe: balances.youOwe,
        youAreOwed: balances.youAreOwed,
        totalYouOwe: Math.round(totalYouOwe * 100) / 100,
        totalYouAreOwed: Math.round(totalYouAreOwed * 100) / 100,
        netBalance: Math.round((totalYouAreOwed - totalYouOwe) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error fetching balances:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch balances",
      error: error.message,
    });
  }
};

// Get balances for a specific group
export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { clerkId } = req.query;

    // Get all balances in the group
    const allBalances = await Balance.find({ group: groupId })
      .populate("fromUser", "fullName email imageUrl")
      .populate("toUser", "fullName email imageUrl");

    // Aggregate balances by unique user pair to avoid duplicates
    const balanceMap = new Map();
    
    allBalances.forEach((b) => {
      if (Math.abs(b.amount) < 0.01) return; // Skip zero balances
      
      // Create a consistent key for the user pair
      const fromId = b.fromUser._id.toString();
      const toId = b.toUser._id.toString();
      const key = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
      
      if (!balanceMap.has(key)) {
        balanceMap.set(key, {
          fromUser: b.fromUser,
          toUser: b.toUser,
          amount: b.amount
        });
      } else {
        // Aggregate amounts for same user pair
        const existing = balanceMap.get(key);
        if (fromId === existing.fromUser._id.toString()) {
          existing.amount += b.amount;
        } else {
          existing.amount -= b.amount;
        }
      }
    });

    // Format balances - convert map to array and normalize direction
    const balances = Array.from(balanceMap.values())
      .filter(b => Math.abs(b.amount) > 0.01)
      .map((b) => {
        if (b.amount > 0) {
          return {
            from: b.fromUser,
            to: b.toUser,
            amount: b.amount,
          };
        } else {
          return {
            from: b.toUser,
            to: b.fromUser,
            amount: Math.abs(b.amount),
          };
        }
      });

    // If clerkId provided, also get user-specific view
    let userView = null;
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) {
        const youOwe = [];
        const youAreOwed = [];

        for (const b of allBalances) {
          if (b.fromUser._id.toString() === user._id.toString()) {
            if (b.amount > 0) {
              youOwe.push({ user: b.toUser, amount: b.amount });
            } else if (b.amount < 0) {
              youAreOwed.push({ user: b.toUser, amount: Math.abs(b.amount) });
            }
          } else if (b.toUser._id.toString() === user._id.toString()) {
            if (b.amount > 0) {
              youAreOwed.push({ user: b.fromUser, amount: b.amount });
            } else if (b.amount < 0) {
              youOwe.push({ user: b.fromUser, amount: Math.abs(b.amount) });
            }
          }
        }

        userView = {
          youOwe,
          youAreOwed,
          totalYouOwe: youOwe.reduce((sum, b) => sum + b.amount, 0),
          totalYouAreOwed: youAreOwed.reduce((sum, b) => sum + b.amount, 0),
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        balances,
        userView,
      },
    });
  } catch (error) {
    console.error("Error fetching group balances:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch balances",
      error: error.message,
    });
  }
};

// Get simplified settlements for a group
// Uses greedy algorithm to minimize number of transactions
export const getSimplifiedBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all balances in the group
    const allBalances = await Balance.find({ group: groupId })
      .populate("fromUser", "fullName email imageUrl")
      .populate("toUser", "fullName email imageUrl");

    // Build net balance for each user
    const netBalances = new Map(); // userId -> net amount (positive = they are owed, negative = they owe)

    for (const b of allBalances) {
      const fromId = b.fromUser._id.toString();
      const toId = b.toUser._id.toString();

      // fromUser owes toUser if amount > 0
      netBalances.set(fromId, (netBalances.get(fromId) || 0) - b.amount);
      netBalances.set(toId, (netBalances.get(toId) || 0) + b.amount);
    }

    // Separate into creditors (positive) and debtors (negative)
    const creditors = []; // {user, amount}
    const debtors = [];

    // We need user info, create a map
    const userMap = new Map();
    for (const b of allBalances) {
      userMap.set(b.fromUser._id.toString(), b.fromUser);
      userMap.set(b.toUser._id.toString(), b.toUser);
    }

    for (const [userId, amount] of netBalances) {
      if (amount > 0.01) {
        creditors.push({ user: userMap.get(userId), amount });
      } else if (amount < -0.01) {
        debtors.push({ user: userMap.get(userId), amount: Math.abs(amount) });
      }
    }

    // Greedy algorithm to simplify settlements
    const settlements = [];
    let i = 0, j = 0;

    // Sort for consistent results
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    while (i < creditors.length && j < debtors.length) {
      const credit = creditors[i];
      const debt = debtors[j];

      const settleAmount = Math.min(credit.amount, debt.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          from: debt.user,
          to: credit.user,
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      credit.amount -= settleAmount;
      debt.amount -= settleAmount;

      if (credit.amount < 0.01) i++;
      if (debt.amount < 0.01) j++;
    }

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    console.error("Error calculating simplified balances:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate simplified balances",
      error: error.message,
    });
  }
};

// Clean up and consolidate duplicate balance records for a group
export const cleanupGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all balances in the group
    const allBalances = await Balance.find({ group: groupId });

    // Group by unique user pair
    const balanceMap = new Map();
    
    allBalances.forEach((b) => {
      const fromId = b.fromUser.toString();
      const toId = b.toUser.toString();
      // Always use smaller ID first for consistent key
      const key = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
      const isReversed = fromId > toId;
      
      if (!balanceMap.has(key)) {
        balanceMap.set(key, {
          fromUser: fromId < toId ? b.fromUser : b.toUser,
          toUser: fromId < toId ? b.toUser : b.fromUser,
          amount: isReversed ? -b.amount : b.amount,
          ids: [b._id]
        });
      } else {
        const existing = balanceMap.get(key);
        existing.amount += isReversed ? -b.amount : b.amount;
        existing.ids.push(b._id);
      }
    });

    // Delete all old records
    await Balance.deleteMany({ group: groupId });

    // Create consolidated records (only if amount is significant)
    let created = 0;
    for (const [key, data] of balanceMap) {
      if (Math.abs(data.amount) > 0.01) {
        await Balance.create({
          group: groupId,
          fromUser: data.fromUser,
          toUser: data.toUser,
          amount: data.amount
        });
        created++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up balances: ${allBalances.length} records consolidated to ${created}`,
      data: {
        before: allBalances.length,
        after: created
      }
    });
  } catch (error) {
    console.error("Error cleaning up balances:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup balances",
      error: error.message,
    });
  }
};