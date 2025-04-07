const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const searchForFriendRoutes = require('./routes/searchForFriendRoutes');
const githubRankRoutes = require('./routes/githubRankRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const userProfileRoutes = require ('./routes/userProfileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const groupChatRoutes = require('./routes/groupChatRoutes');
const path = require('path');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.IO setup with proper CORS
const io = new Server(server, {
  cors: {
    origin: "http://192.168.29.249:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  },
  transports: ['websocket']
});

// Make io globally available
global.io = io;

// Make io available to our app (for backward compatibility)
app.set('io', io);

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [ 'http://192.168.29.249:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add better error handling for parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Bad request format' });
  }
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store userId for this socket
  let authenticatedUserId = null;

  // Authenticate socket connection
  socket.on('authenticate', (userId) => {
    if (userId) {
      authenticatedUserId = userId;
      socket.join(userId.toString());
      console.log('User authenticated:', userId, 'Socket:', socket.id);
      
      // Send initial notification count
      socket.emit('ready', { status: 'connected' });
    }
  });

  // Join team chat room
  socket.on('joinTeamChat', (teamId) => {
    if (teamId && authenticatedUserId) {
      const roomName = `team-${teamId}`;
      socket.join(roomName);
      console.log(`User ${authenticatedUserId} (Socket: ${socket.id}) joined team chat: ${roomName}`);
      
      // Log all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      console.log(`Socket ${socket.id} is now in rooms:`, rooms);
    } else {
      console.log('Unauthorized attempt to join team chat:', teamId, 'Socket:', socket.id);
    }
  });

  // Leave team chat room
  socket.on('leaveTeamChat', (teamId) => {
    if (teamId && authenticatedUserId) {
      const roomName = `team-${teamId}`;
      socket.leave(roomName);
      console.log(`User ${authenticatedUserId} (Socket: ${socket.id}) left team chat: ${roomName}`);
      
      // Log all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      console.log(`Socket ${socket.id} is now in rooms:`, rooms);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, authenticatedUserId ? `(User: ${authenticatedUserId})` : '');
  });
});

// API Routes
app.use('/api/competitions', competitionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRankRoutes);
app.use('/api/searchForFriends', searchForFriendRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/group-chat', groupChatRoutes);

// Connect MongoDB
connectDB();

// Start Server
server.listen(PORT,'192.168.29.249', () => {
  console.log(`Server running on port ${PORT}`);
});
