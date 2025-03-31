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

// Add this middleware before exporting the model
teamSchema.pre('save', async function(next) {
    if (this.members && this.members.length > 0) {
        // Populate members to get their scores
        await this.populate('members', 'frontendScore backendScore eqScore');
        
        // Calculate average scores
        const totalScores = this.members.reduce((acc, member) => {
            return {
                frontend: acc.frontend + (member.frontendScore || 0),
                backend: acc.backend + (member.backendScore || 0),
                eq: acc.eq + (member.eqScore || 0)
            };
        }, { frontend: 0, backend: 0, eq: 0 });

        const memberCount = this.members.length;
        
        this.averageFrontendScore = totalScores.frontend / memberCount;
        this.averageBackendScore = totalScores.backend / memberCount;
        this.averageEqScore = totalScores.eq / memberCount;
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema);

