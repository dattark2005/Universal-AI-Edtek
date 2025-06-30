import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas with proper options
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // More detailed error logging
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication failed - check your username and password');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error - check your internet connection');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Connection timeout - MongoDB Atlas may be slow to respond');
    }
    
    console.error('Full error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});