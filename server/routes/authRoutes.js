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

const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Use the upload middleware on the /register route for handling the resume PDF.
// The field name 'resume' must match the key in Postman when sending the file.
router.post('/register', uploadMiddleware.single('resume'), registerUser);

router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected route

module.exports = router;
