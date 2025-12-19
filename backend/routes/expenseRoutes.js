import express from "express";
import {
  createExpense,
  getGroupExpenses,
  getUserExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

// POST /api/expenses - Create a new expense
router.post("/", createExpense);

// GET /api/expenses/group/:groupId - Get all expenses for a group
router.get("/group/:groupId", getGroupExpenses);

// GET /api/expenses/user/:clerkId - Get all expenses for a user
router.get("/user/:clerkId", getUserExpenses);

// GET /api/expenses/:expenseId - Get single expense
router.get("/:expenseId", getExpenseById);

// PUT /api/expenses/:expenseId - Update expense
router.put("/:expenseId", updateExpense);

// DELETE /api/expenses/:expenseId - Delete expense
router.delete("/:expenseId", deleteExpense);

export default router;
