import { Server } from 'socket.io';

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    // Add more socket event handlers here as needed
  });
};