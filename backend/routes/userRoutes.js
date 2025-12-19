import express from "express";
import {
  syncUser,
  getProfile,
  getUserByEmail,
  searchUsers,
} from "../controllers/userController.js";

const router = express.Router();

// POST /api/users/sync - Sync user from Clerk
router.post("/sync", syncUser);

// GET /api/users/profile/:clerkId - Get user profile
router.get("/profile/:clerkId", getProfile);

// GET /api/users/email/:email - Get user by email
router.get("/email/:email", getUserByEmail);

// GET /api/users/search?query= - Search users
router.get("/search", searchUsers);

export default router;
