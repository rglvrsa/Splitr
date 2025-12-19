import express from "express";
import {
  getUserBalances,
  getGroupBalances,
  getSimplifiedBalances,
  cleanupGroupBalances,
} from "../controllers/balanceController.js";

const router = express.Router();

// GET /api/balances/user/:clerkId - Get all balances for a user
router.get("/user/:clerkId", getUserBalances);

// GET /api/balances/group/:groupId - Get all balances in a group
router.get("/group/:groupId", getGroupBalances);

// GET /api/balances/group/:groupId/simplified - Get simplified settlements
router.get("/group/:groupId/simplified", getSimplifiedBalances);

// POST /api/balances/group/:groupId/cleanup - Cleanup duplicate balance records
router.post("/group/:groupId/cleanup", cleanupGroupBalances);

export default router;
