const mongoose = require('mongoose');

const groupChatMetaSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupChat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastSeen: { type: Date, default: null },
  unreadCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('GroupChatMeta', groupChatMetaSchema); 