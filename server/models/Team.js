const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
 

  averageFrontendScore: Number,
  averageBackendScore: Number,
  averageEqScore: Number,

  // Combined unique skill set from all team members
  skills: { type: [String], default: [] },

  // Competition association (if the team is registering for one)
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },

  // Team collaboration
  groupChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },

  // Optional: Store pending invites or join requests as IDs
  // (Alternatively, use separate collections for invites/requests)
  //invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamInvite' }],
  //joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JoinRequest' }],

  // Lock team for new members if needed
  
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);

