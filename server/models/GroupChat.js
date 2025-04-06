const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('GroupChat', groupChatSchema); 