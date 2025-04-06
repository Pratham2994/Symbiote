const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupChat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 36 * 60 * 60 * 1000) } // 36 hours from now
}, { timestamps: true });

// Create TTL index on expiresAt field
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema); 