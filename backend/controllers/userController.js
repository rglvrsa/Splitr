import User from "../models/User.js";

// Sync user from Clerk (called after Clerk authentication)
export const syncUser = async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, fullName, imageUrl } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "clerkId and email are required" 
      });
    }

    // Use findOneAndUpdate with upsert to handle both create and update
    const user = await User.findOneAndUpdate(
      { clerkId }, // Find by clerkId
      {
        $set: {
          clerkId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: fullName || '',
          imageUrl: imageUrl || '',
        }
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: "User synced successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sync user",
      error: error.message 
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId }).populate("groups", "name description");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch profile",
      error: error.message 
    });
  }
};

// Get user by email (for adding members to groups)
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user",
      error: error.message 
    });
  }
};

// Get all users (for search/autocomplete)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: "Search query must be at least 2 characters" 
      });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id email fullName imageUrl")
      .limit(10);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to search users",
      error: error.message 
    });
  }
};
