const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'FRIEND_REQUEST',
      'FRIEND_REQUEST_ACCEPTED',
      'FRIEND_REQUEST_REJECTED',
      'TEAM_INVITE',
      'TEAM_INVITE_ACCEPTED',
      'TEAM_INVITE_REJECTED',
      'TEAM_JOIN_REQUEST',
      'TEAM_JOIN_REQUEST_ACCEPTED',
      'TEAM_JOIN_REQUEST_REJECTED',
      'TEAM_DELETED'
    ],
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  seen: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['ACCEPT_REJECT', 'VIEW', null],
    default: null
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, seen: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 