const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser,
  upload,
  sendOTP,
  verifyOTP
} = require('../controller/authController');

const { protect } = require('../middleware/authMiddlewareStudent');

const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', uploadMiddleware.single('resume'), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify', protect, verifyToken);

module.exports = router;
