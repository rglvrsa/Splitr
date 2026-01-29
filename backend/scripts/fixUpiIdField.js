import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixUpiIdField = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users that have upIId field (with capital I)
    const users = await User.find({});
    
    let fixedCount = 0;
    for (const user of users) {
      // Check if the document has upIId in the raw object
      const rawDoc = user.toObject();
      if (rawDoc.upIId !== undefined && rawDoc.upiId !== rawDoc.upIId) {
        // Copy upIId to upiId
        user.upiId = rawDoc.upIId;
        await user.save();
        console.log(`Fixed user ${user.fullName}: ${rawDoc.upIId} -> upiId`);
        fixedCount++;
      }
    }

    console.log(`\nFixed ${fixedCount} users`);
    
    // Also directly update any documents with upIId field
    const result = await mongoose.connection.db.collection('users').updateMany(
      { upIId: { $exists: true } },
      [
        {
          $set: {
            upiId: { $ifNull: ['$upiId', '$upIId'] }
          }
        },
        {
          $unset: 'upIId'
        }
      ]
    );
    
    console.log(`MongoDB updateMany result: ${result.modifiedCount} documents modified`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUpiIdField();
