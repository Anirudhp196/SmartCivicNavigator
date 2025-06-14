import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-civic-navigator-test';

// Function to connect to test database
export const setupTestDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI as string;
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
};

// Function to clear test database
export const clearTestDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
};

// Function to close database connection
export const closeTestDB = async () => {
  await mongoose.connection.close();
}; 