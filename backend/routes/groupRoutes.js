import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  removeMember,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = express.Router();

// POST /api/groups - Create a new group
router.post("/", createGroup);

// GET /api/groups/user/:clerkId - Get all groups for a user
router.get("/user/:clerkId", getUserGroups);

// GET /api/groups/:groupId - Get single group
router.get("/:groupId", getGroupById);

// PUT /api/groups/:groupId - Update group
router.put("/:groupId", updateGroup);

// DELETE /api/groups/:groupId - Delete group
router.delete("/:groupId", deleteGroup);

// POST /api/groups/:groupId/members - Add member to group
router.post("/:groupId/members", addMember);

// DELETE /api/groups/:groupId/members/:userId - Remove member from group
router.delete("/:groupId/members/:userId", removeMember);

export default router;
