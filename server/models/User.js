const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Admin'], default: 'Student' },
  
  // Profile and about section
  aboutMe: { type: String, maxlength: 500 },
  
  // GitHub URL
  githubLink: { type: String },
  
  // Optional additional social links (array of URLs)
  socialLinks: [{ type: String }],
  
  // Skills & resume
  skills: { type: String }, // JSON string of skills
  resumePath: { type: String },
  
  // EQ questionnaire answers
  eqAnswers: {
    type: Map,
    of: Number
  },
  
  // Scores returned by ML model
  frontendScore: { type: Number },
  backendScore: { type: Number },
  eqScore: { type: Number },

  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);