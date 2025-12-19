import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Balance from "../models/Balance.js";
import mongoose from "mongoose";

// Create a new expense
export const createExpense = async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      paidBy,        // Single payer - Can be MongoDB ID (legacy)
      paidByClerkId, // Single payer - Or Clerk ID (legacy)
      paidByMultiple, // Array of { userId/clerkId, amount } for multiple payers
      splitType,
      splits, // Array of { userId/clerkId, amount?, percentage? }
      category,
      expenseDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!groupId || !description || !amount || !splitType || !splits) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Need either paidBy, paidByClerkId, or paidByMultiple
    if (!paidBy && !paidByClerkId && (!paidByMultiple || paidByMultiple.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "paidBy, paidByClerkId, or paidByMultiple is required",
      });
    }

    // Validate split type
    if (!["equal", "exact", "percentage"].includes(splitType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid split type. Must be 'equal', 'exact', or 'percentage'",
      });
    }

    // Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Process payers - support both single and multiple
    let processedPayers = [];
    let singlePayer = null;

    if (paidByMultiple && paidByMultiple.length > 0) {
      // Multiple payers
      let totalPaid = 0;
      for (const payerInfo of paidByMultiple) {
        let user;
        const payerId = payerInfo.userId || payerInfo.user || payerInfo.id;
        
        if (payerId && mongoose.Types.ObjectId.isValid(payerId)) {
          user = await User.findById(payerId);
        }
        if (!user && payerInfo.clerkId) {
          user = await User.findOne({ clerkId: payerInfo.clerkId });
        }
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: `Payer not found: ${JSON.stringify(payerInfo)}`,
          });
        }

        if (!payerInfo.amount || payerInfo.amount <= 0) {
          return res.status(400).json({
            success: false,
            message: "Each payer must have a positive amount",
          });
        }

        processedPayers.push({
          user: user._id,
          amount: payerInfo.amount,
        });
        totalPaid += payerInfo.amount;
      }

      // Validate total paid matches expense amount
      if (Math.abs(totalPaid - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Total paid (${totalPaid}) doesn't match expense amount (${amount})`,
        });
      }

      // Use first payer as the primary payer for legacy support
      singlePayer = await User.findById(processedPayers[0].user);
    } else {
      // Single payer (legacy)
      if (paidBy && mongoose.Types.ObjectId.isValid(paidBy)) {
        singlePayer = await User.findById(paidBy);
      }
      if (!singlePayer && paidByClerkId) {
        singlePayer = await User.findOne({ clerkId: paidByClerkId });
      }
      if (!singlePayer) {
        return res.status(404).json({
          success: false,
          message: "Payer not found",
        });
      }
      processedPayers = [{ user: singlePayer._id, amount: amount }];
    }

    // Process splits - handle both MongoDB IDs and clerkIds
    const processedSplits = [];
    let totalSplitAmount = 0;
    let totalPercentage = 0;

    for (const split of splits) {
      let user;
      
      // Try to find user by MongoDB ID - check various field names frontend might use
      const odId = split.userId || split.odId || split.user || split.id || split.memberId;
      console.log("Processing split - looking for userId:", odId);
      console.log("Full split object:", JSON.stringify(split));
      
      if (odId && mongoose.Types.ObjectId.isValid(odId)) {
        user = await User.findById(odId);
        if (user) {
          console.log("Found user by MongoDB ID:", user._id, user.fullName);
        }
      }
      
      // If not found, try by clerkId
      if (!user && split.clerkId) {
        user = await User.findOne({ clerkId: split.clerkId });
        if (user) {
          console.log("Found user by clerkId:", user._id, user.fullName);
        }
      }
      
      if (!user) {
        console.error("User not found! Split object was:", JSON.stringify(split));
        console.error("Tried userId value:", odId);
        return res.status(404).json({
          success: false,
          message: `User not found for split. Received: ${JSON.stringify(split)}`,
        });
      }

      const splitData = { user: user._id };

      if (splitType === "equal") {
        // Amount will be calculated in pre-save hook
        splitData.amount = amount / splits.length;
      } else if (splitType === "exact") {
        if (split.amount === undefined) {
          return res.status(400).json({
            success: false,
            message: "Exact split requires amount for each user",
          });
        }
        splitData.amount = split.amount;
        totalSplitAmount += split.amount;
      } else if (splitType === "percentage") {
        if (split.percentage === undefined) {
          return res.status(400).json({
            success: false,
            message: "Percentage split requires percentage for each user",
          });
        }
        splitData.percentage = split.percentage;
        splitData.amount = (amount * split.percentage) / 100;
        totalPercentage += split.percentage;
      }

      processedSplits.push(splitData);
    }

    // Validate splits
    if (splitType === "exact" && Math.abs(totalSplitAmount - amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Split amounts (${totalSplitAmount}) don't add up to total (${amount})`,
      });
    }

    if (splitType === "percentage" && Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Percentages (${totalPercentage}%) don't add up to 100%`,
      });
    }

    // Create expense with multiple payers support
    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      paidBy: singlePayer._id, // For legacy compatibility
      paidByMultiple: processedPayers, // New: array of payers
      splitType,
      splits: processedSplits,
      category: category || "other",
      expenseDate: expenseDate || new Date(),
      notes: notes || "",
      createdBy: singlePayer._id,
    });

    // Update balances with multiple payers support
    // For each person who owes money (split), they owe to each payer proportionally
    for (const split of processedSplits) {
      const splitUserId = split.user.toString();
      
      // Calculate how much this split user owes to each payer
      for (const payer of processedPayers) {
        const payerId = payer.user.toString();
        
        // Skip if the split user is this payer (they don't owe themselves)
        if (splitUserId === payerId) {
          continue;
        }

        // Calculate proportional amount this split user owes to this payer
        // Based on what percentage of total this payer contributed
        const payerContributionRatio = payer.amount / amount;
        const amountOwedToPayer = split.amount * payerContributionRatio;

        if (amountOwedToPayer > 0.01) {
          // The split user owes this payer
          await Balance.updateBalance(groupId, split.user, payer.user, amountOwedToPayer);
        }
      }
    }

    // Update group's total expenses
    group.totalExpenses += amount;
    await group.save();

    // Populate and return
    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "fullName email imageUrl")
      .populate("paidByMultiple.user", "fullName email imageUrl")
      .populate("splits.user", "fullName email imageUrl")
      .populate("group", "name");

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: populatedExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

// Get all expenses for a group
export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "fullName email imageUrl")
      .populate("paidByMultiple.user", "fullName email imageUrl")
      .populate("splits.user", "fullName email imageUrl")
      .sort({ expenseDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// Get all expenses for a user (across all groups)
export const getUserExpenses = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get expenses where user paid or is part of split
    const expenses = await Expense.find({
      $or: [
        { paidBy: user._id },
        { "splits.user": user._id },
      ],
    })
      .populate("paidBy", "fullName email imageUrl")
      .populate("splits.user", "fullName email imageUrl")
      .populate("group", "name")
      .sort({ expenseDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// Get single expense
export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "fullName email imageUrl")
      .populate("splits.user", "fullName email imageUrl")
      .populate("group", "name");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, category, expenseDate, notes } = req.body;

    // Note: Updating splits would require recalculating balances
    // For simplicity, we only allow updating non-financial fields
    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { description, category, expenseDate, notes },
      { new: true }
    )
      .populate("paidBy", "fullName email imageUrl")
      .populate("splits.user", "fullName email imageUrl")
      .populate("group", "name");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Reverse the balance changes
    for (const split of expense.splits) {
      if (split.user.toString() === expense.paidBy.toString()) {
        continue;
      }
      // Reverse: subtract the amount that was added
      await Balance.updateBalance(
        expense.group,
        split.user,
        expense.paidBy,
        -split.amount
      );
    }

    // Update group's total expenses
    await Group.findByIdAndUpdate(expense.group, {
      $inc: { totalExpenses: -expense.amount },
    });

    // Delete expense
    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};
