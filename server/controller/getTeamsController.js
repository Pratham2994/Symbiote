const Team = require('../models/Team')

const getAllTeams = async (req, res) => {
    try {
        const { _id } = req.body;

        // Ensure _id is provided
        if (!_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find teams where the user is a member
        const teams = await Team.find({ members: _id }).populate('members');

        // Log the teams for debugging
        console.log(teams);

        // Return the teams in the response
        return res.status(200).json(teams);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching teams' });
    }
};

module.exports = { getAllTeams };