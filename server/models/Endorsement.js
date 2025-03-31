const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, 
  comment: String,
  endorsedSkills: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Endorsement', endorsementSchema);
