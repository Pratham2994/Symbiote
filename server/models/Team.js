// const mongoose = require('mongoose');

// const teamSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   maxMembers: { type: Number, default: 4 },

//   averageFrontendScore: Number,
//   averageBackendScore: Number,
//   averageGithubScore: Number,
//   averageEqScore: Number,

//   // Combined unique skill set from all team members
//   skills: { type: [String], default: [] },

//   // Competition association (if the team is registering for one)
//   competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },

//   // Team collaboration
//   groupChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },

//   // Optional: Store pending invites or join requests as IDs
//   // (Alternatively, use separate collections for invites/requests)
//   //invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamInvite' }],
//   //joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JoinRequest' }],

//   // Lock team for new members if needed
//   isLocked: { type: Boolean, default: false }
// }, { timestamps: true });

// module.exports = mongoose.model('Team', teamSchema);

