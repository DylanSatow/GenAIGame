require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const characterRoutes = require('./routes/characterRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/characters', characterRoutes);
app.use('/api/game', gameRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Game events
  socket.on('startGame', async (data) => {
    try {
      const gameState = await gameService.startNewGame(data.characterId);
      socket.emit('gameState', gameState);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('playerAction', async (data) => {
    try {
      const gameState = await gameService.handlePlayerAction(data.characterId, data.action);
      socket.emit('gameState', gameState);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 