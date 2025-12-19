import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    // Remove trailing slash if present and add database name
    let uri = process.env.MONGODB_URI || '';
    // Remove quotes if present (from .env file)
    uri = uri.replace(/"/g, '').replace(/'/g, '');
    // Remove trailing slash if present
    uri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
    
    await mongoose.connect(`${uri}/spliter`);
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;