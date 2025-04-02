const Team = require('../models/Team')

const getUserTeams = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const teams = await Team.find({ members: userId })
            .populate('members')
            .populate('createdBy')
            .populate('competition')
            .sort({createdAt: -1});

        return res.status(200).json(teams);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching teams' });
    }
};

const getOneTeam = async(req, res) =>{
    try{
        const { teamId } = req.params;
        if (!teamId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const team = await Team.findById(teamId)
            .populate('members')
            .populate('createdBy')
            .populate('competition');

        return res.status(200).json({team})
    }
    catch(err){
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching teams' });
    }
}

module.exports = { getUserTeams, getOneTeam };