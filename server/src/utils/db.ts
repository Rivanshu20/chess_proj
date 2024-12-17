import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
