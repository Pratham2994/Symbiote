const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected route
router.get('/verify', protect, verifyToken);

module.exports = router;
