import express from "express";
import {
  createSettlement,
  getGroupSettlements,
  getUserSettlements,
  deleteSettlement,
} from "../controllers/settlementController.js";

const router = express.Router();

// POST /api/settlements - Create a settlement (settle up)
router.post("/", createSettlement);

// GET /api/settlements/group/:groupId - Get all settlements in a group
router.get("/group/:groupId", getGroupSettlements);

// GET /api/settlements/user/:clerkId - Get all settlements for a user
router.get("/user/:clerkId", getUserSettlements);

// DELETE /api/settlements/:settlementId - Delete/undo a settlement
router.delete("/:settlementId", deleteSettlement);

export default router;
