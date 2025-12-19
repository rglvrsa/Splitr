import Group from "../models/Group.js";
import User from "../models/User.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, createdByClerkId } = req.body;

    if (!name || !createdByClerkId) {
      return res.status(400).json({
        success: false,
        message: "Group name and creator are required",
      });
    }

    // Find the user who is creating the group
    const creator = await User.findOne({ clerkId: createdByClerkId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create group with creator as admin member
    const group = await Group.create({
      name,
      description: description || "",
      createdBy: creator._id,
      members: [
        {
          user: creator._id,
          role: "admin",
        },
      ],
    });

    // Add group to user's groups array
    creator.groups.push(group._id);
    await creator.save();

    // Populate and return
    const populatedGroup = await Group.findById(group._id)
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: populatedGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error.message,
    });
  }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const groups = await Group.find({
      "members.user": user._id,
      isActive: true,
    })
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
      error: error.message,
    });
  }
};

// Get single group by ID
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group",
      error: error.message,
    });
  }
};

// Add member to group
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
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

    // Find user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found. They need to sign up first.",
      });
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    // Add member
    group.members.push({
      user: userToAdd._id,
      role: "member",
    });
    await group.save();

    // Add group to user's groups array
    userToAdd.groups.push(group._id);
    await userToAdd.save();

    // Return updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add member",
      error: error.message,
    });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is in the group
    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === userId
    );
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    // Don't allow removing the admin/creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the group creator",
      });
    }

    // Remove member
    group.members.splice(memberIndex, 1);
    await group.save();

    // Remove group from user's groups array
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: group._id },
    });

    const updatedGroup = await Group.findById(groupId)
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl");

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove member",
      error: error.message,
    });
  }
};

// Update group details
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { name, description },
      { new: true }
    )
      .populate("createdBy", "fullName email imageUrl")
      .populate("members.user", "fullName email imageUrl");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update group",
      error: error.message,
    });
  }
};

// Delete group (soft delete)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { isActive: false },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete group",
      error: error.message,
    });
  }
};
