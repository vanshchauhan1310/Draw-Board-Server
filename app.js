import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configure CORS
app.use(cors({
  origin: 'https://draw-board-client.vercel.app/', // Your React app's URL
  methods: ['GET', 'POST']
}));

const io = new Server(server, {
  cors: {
    origin: 'https://draw-board-client.vercel.app/',
    methods: ['GET', 'POST']
  }
});

// Store connected users and their drawing data
const users = new Map();
const drawingHistory = [];


io.on('connection', (socket) => {
  console.log('New client connected');

  // Add new user
  socket.on('register_user', (username) => {
    users.set(socket.id, username);
    
    // Emit updated user list to all clients
    io.emit('update_users', Array.from(users.values()));
    
    // Send existing drawing history to new user
    socket.emit('drawing_history', drawingHistory);
  });

  // Handle drawing events
  socket.on('draw', (drawData) => {
    // Store drawing data in history
    drawingHistory.push(drawData);
    
    // Broadcast drawing to all other clients
    socket.broadcast.emit('draw', drawData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    
    // Emit updated user list
    io.emit('update_users', Array.from(users.values()));
    
    console.log(`${username} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
