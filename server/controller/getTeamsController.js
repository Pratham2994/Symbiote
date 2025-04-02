const Team = require('../models/Team')

const getAllTeams = async (req, res) => {
    try {
        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const teams = await Team.find({ members: _id }).populate('members');


        return res.status(200).json(teams);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching teams' });
    }
};

module.exports = { getAllTeams };