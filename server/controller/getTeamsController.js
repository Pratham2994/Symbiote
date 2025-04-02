const Team = require('../models/Team')

const getUserTeams = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const teams = await Team.find({ members: userId }).populate('members');

        return res.status(200).json(teams);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching teams' });
    }
};

module.exports = { getUserTeams };