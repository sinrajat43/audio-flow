import mongoose from 'mongoose';
import { config } from './environment';
import { logInfo, logError } from '../utils/logger';

/**
 * Connects to MongoDB Atlas
 */
export async function connectDatabase(): Promise<void> {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(config.database.uri, options);

    logInfo('Successfully connected to MongoDB', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });

    // Handle connection events
    mongoose.connection.on('error', (error: Error) => {
      logError('MongoDB connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
      logInfo('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } catch (error) {
    logError('Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Disconnects from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logInfo('MongoDB connection closed');
  } catch (error) {
    logError('Error closing MongoDB connection', error);
    throw error;
  }
}

/**
 * Clears all collections (useful for testing)
 */
export async function clearDatabase(): Promise<void> {
  if (config.app.isTest) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}
