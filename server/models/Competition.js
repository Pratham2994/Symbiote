const mongoose = require('mongoose');


const competitionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ongoing: { type: Boolean, default: false },
    tags: [{ type: String }],
    description: { type: String },
    collegeName: { type: String },
    hackathonLocation: { type: String },
    hackathonStartDate: { type: Date },
    hackathonEndDate: { type: Date },
    timing: { type: String },
    registrationLink: { type: String },
    prize: { type: String },
    registrationDeadline: { type: Date },
    registrationFee: { type: Number, default: 0 },
    contact: { type: String },

    // New field: an array to hold references to the teams that registered
    registeredTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]

}, { timestamps: true });


const Competition = mongoose.model('Competition', competitionSchema);
