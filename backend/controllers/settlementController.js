import Settlement from "../models/Settlement.js";
import Balance from "../models/Balance.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";

// Create a settlement (settle up)
export const createSettlement = async (req, res) => {
  try {
    const { 
      groupId, 
      paidBy, paidByClerkId,  // Accept both MongoDB ID and Clerk ID
      paidTo, paidToClerkId,  // Accept both MongoDB ID and Clerk ID
      amount, 
      paymentMethod, 
      notes 
    } = req.body;

    console.log("Settlement request:", req.body);

    if (!groupId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: groupId and amount are required",
      });
    }

    // Need either paidBy or paidByClerkId
    if (!paidBy && !paidByClerkId) {
      return res.status(400).json({
        success: false,
        message: "paidBy or paidByClerkId is required",
      });
    }

    // Need either paidTo or paidToClerkId
    if (!paidTo && !paidToClerkId) {
      return res.status(400).json({
        success: false,
        message: "paidTo or paidToClerkId is required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be positive",
      });
    }

    // Find payer - try MongoDB ID first, then Clerk ID
    let payer;
    if (paidBy && mongoose.Types.ObjectId.isValid(paidBy)) {
      payer = await User.findById(paidBy);
    }
    if (!payer && paidByClerkId) {
      payer = await User.findOne({ clerkId: paidByClerkId });
    }

    // Find receiver - try MongoDB ID first, then Clerk ID
    let receiver;
    if (paidTo && mongoose.Types.ObjectId.isValid(paidTo)) {
      receiver = await User.findById(paidTo);
    }
    if (!receiver && paidToClerkId) {
      receiver = await User.findOne({ clerkId: paidToClerkId });
    }

    if (!payer || !receiver) {
      console.error("User not found - payer:", payer, "receiver:", receiver);
      return res.status(404).json({
        success: false,
        message: "User not found",
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

    // Create settlement record
    const settlement = await Settlement.create({
      group: groupId,
      paidBy: payer._id,
      paidTo: receiver._id,
      amount,
      paymentMethod: paymentMethod || "other",
      notes: notes || "",
    });

    // Update balance: payer paid receiver, so payer's debt to receiver decreases
    // This means receiver -> payer balance decreases (receiver is owed less)
    await Balance.updateBalance(groupId, payer._id, receiver._id, -amount);

    // Populate and return
    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate("paidBy", "fullName email imageUrl")
      .populate("paidTo", "fullName email imageUrl")
      .populate("group", "name");

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully",
      data: populatedSettlement,
    });
  } catch (error) {
    console.error("Error creating settlement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create settlement",
      error: error.message,
    });
  }
};

// Get settlements for a group
export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const settlements = await Settlement.find({ group: groupId })
      .populate("paidBy", "fullName email imageUrl")
      .populate("paidTo", "fullName email imageUrl")
      .sort({ settlementDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlements",
      error: error.message,
    });
  }
};

// Get settlements for a user
export const getUserSettlements = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const settlements = await Settlement.find({
      $or: [{ paidBy: user._id }, { paidTo: user._id }],
    })
      .populate("paidBy", "fullName email imageUrl")
      .populate("paidTo", "fullName email imageUrl")
      .populate("group", "name")
      .sort({ settlementDate: -1, createdAt: -1 });

    // Separate into paid and received
    const paid = settlements.filter(
      (s) => s.paidBy._id.toString() === user._id.toString()
    );
    const received = settlements.filter(
      (s) => s.paidTo._id.toString() === user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        all: settlements,
        paid,
        received,
        totalPaid: paid.reduce((sum, s) => sum + s.amount, 0),
        totalReceived: received.reduce((sum, s) => sum + s.amount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settlements",
      error: error.message,
    });
  }
};

// Delete settlement (undo)
export const deleteSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    // Reverse the balance change
    await Balance.updateBalance(
      settlement.group,
      settlement.paidBy,
      settlement.paidTo,
      settlement.amount // Add back the amount that was subtracted
    );

    await Settlement.findByIdAndDelete(settlementId);

    res.status(200).json({
      success: true,
      message: "Settlement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting settlement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete settlement",
      error: error.message,
    });
  }
};
