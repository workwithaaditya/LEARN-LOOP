import express from 'express';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// @route   POST /api/match/find
// @desc    Find a random match based on skills
router.post('/find', isAuthenticated, async (req, res) => {
  try {
    const { preferredSkills } = req.body;
    const currentUser = req.user;

    // Build query to find available users not in call
    const whereClause = {
      id: { [Op.ne]: currentUser.id },
      isAvailable: true,
      inCall: false
    };

    // If preferred skills provided, prioritize those
    if (preferredSkills && preferredSkills.length > 0) {
      whereClause.skills = { [Op.overlap]: preferredSkills };
    }

    // Find matching users
    let matches = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'avatar', 'skills', 'bio', 'socketId'],
      limit: 10
    });

    // If no skill-based matches found, find any available user
    if (matches.length === 0 && preferredSkills) {
      matches = await User.findAll({
        where: {
          id: { [Op.ne]: currentUser.id },
          isAvailable: true,
          inCall: false
        },
        attributes: ['id', 'name', 'avatar', 'skills', 'bio', 'socketId'],
        limit: 10
      });
    }

    if (matches.length === 0) {
      return res.json({ 
        match: null, 
        message: 'No users available for matching right now' 
      });
    }

    // Select random match from available users
    const randomMatch = matches[Math.floor(Math.random() * matches.length)];

    res.json({ match: randomMatch });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: 'Failed to find match' });
  }
});

export default router;
