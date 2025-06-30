import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables FIRST
dotenv.config();

// Import database connection
import { connectDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import quizRoutes from './routes/quizzes';
import classroomRoutes from './routes/classrooms';
import assignmentRoutes from './routes/assignments';
import studyPlanRoutes from './routes/studyPlans';
import leaderboardRoutes from './routes/leaderboards';
import uploadRoutes from './routes/upload';
import aiRoutes from './routes/ai';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import services
import { initializeSocket } from './services/socketService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initializeSocket(io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Then start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;