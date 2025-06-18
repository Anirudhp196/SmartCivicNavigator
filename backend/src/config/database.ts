import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_civic_navigator';
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectWithRetry = async (retryCount = 0): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Production-ready options
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectWithRetry(retryCount + 1);
    } else {
      console.error('Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

export const connectDB = async (): Promise<void> => {
  await connectWithRetry();
};

// Connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  if (process.env.NODE_ENV === 'production') {
    connectWithRetry();
  }
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
  if (process.env.NODE_ENV === 'production') {
    connectWithRetry();
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
}); 