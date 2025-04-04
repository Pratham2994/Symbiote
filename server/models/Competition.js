const mongoose = require('mongoose');


const competitionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ongoing: { type: Boolean, default: false },
    tags: [{ type: String }],
    description: { type: String },
    collegeName: { type: String },
    competitionLocation: { type: String },
    competitionStartDate: { type: Date },
    competitionEndDate: { type: Date },
    timing: { type: String },
    registrationLink: { type: String },
    maxTeamSize: { type: Number, default: 4 },
    prize: { type: String },
    registrationDeadline: { type: Date },
    registrationFee: { type: mongoose.Schema.Types.Mixed, default: 0 },
    
    contact: { type: String },

    // New field: an array to hold references to the teams that registered
    registeredTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],

    imagePath: { type: String }

}, { timestamps: true });


module.exports = mongoose.model('Competition', competitionSchema);
