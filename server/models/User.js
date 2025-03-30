const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Admin'], default: 'Student' },
  
  // Profile and about section
  aboutMe: { type: String, maxlength: 500 },
  
  // GitHub URL is compulsory
  github: { type: String},
  
  // Optional additional social links (array of URLs)
  socialLinks: [{ type: String }],
  
  // Skills & resume
  skills: { type: [String], default: [] },
  
  // Scores returned by ML model
  frontendScore: Number,
  backendScore: Number,
  eqScore: Number,
  
  // Friend system: list of friend user IDs
  // friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);