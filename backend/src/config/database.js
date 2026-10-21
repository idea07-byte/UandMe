import mongoose from 'mongoose';

/**
 * Connect to the MongoDB database using Mongoose.
 * Validates the connection string and handles connection failures strictly
 * to prevent the application from silently running in a broken state.
 *
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('====================================================');
    console.error('❌ FATAL CONFIGURATION ERROR: MONGODB_URI is undefined!');
    console.error('👉 Please define MONGODB_URI in your backend/.env file.');
    console.error('   Example: MONGODB_URI=mongodb://127.0.0.1:27017/pulsechat');
    console.error('====================================================');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });

    console.log('====================================================');
    console.log(`🍃 Connected to MongoDB successfully!`);
    console.log(`📍 Host:     ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log('====================================================');

    // Attach event listeners for connection lifecycle
    mongoose.connection.on('error', (err) => {
      console.error('❌ Runtime MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB connection lost. Reconnecting...');
    });

    return conn;
  } catch (error) {
    console.error('====================================================');
    console.error('❌ FATAL: Failed to connect to MongoDB database.');
    console.error(`💥 Reason: ${error.message}`);
    console.error('👉 Troubleshooting Checklist:');
    console.error('   1. Is your local MongoDB server running? (Run: mongod or net start MongoDB)');
    console.error('   2. If using Atlas, is your IP address whitelisted in Network Access?');
    console.error('   3. Are your MongoDB username and password in .env correct?');
    console.error('====================================================');

    // Crucial requirement: Do not allow the application to silently continue without a DB
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB gracefully on application shutdown.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close(false);
    console.log('🍃 MongoDB connection closed gracefully.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};

export default connectDB;
