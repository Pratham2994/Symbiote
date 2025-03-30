const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/config');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // Added middleware to parse URL-encoded bodies
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Connect MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
