import express from 'express';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Store io instance reference
let ioInstance = null;

export const setIoInstance = (io) => {
  ioInstance = io;
};

// @route   POST /api/match/find
// @desc    Find a random match based on skills (only online users)
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
      limit: 50 // Get more candidates to filter by online status
    });

    // Filter to only users who are actually online (connected via Socket.io)
    if (ioInstance && ioInstance.onlineUsers) {
      matches = matches.filter(user => ioInstance.onlineUsers.has(user.id));
    }

    // If no skill-based online matches found, find any online available user
    if (matches.length === 0 && preferredSkills) {
      matches = await User.findAll({
        where: {
          id: { [Op.ne]: currentUser.id },
          isAvailable: true,
          inCall: false
        },
        attributes: ['id', 'name', 'avatar', 'skills', 'bio', 'socketId'],
        limit: 50
      });
      
      // Filter by online status again
      if (ioInstance && ioInstance.onlineUsers) {
        matches = matches.filter(user => ioInstance.onlineUsers.has(user.id));
      }
    }

    if (matches.length === 0) {
      return res.json({ 
        match: null, 
        message: 'No users online and available for matching right now' 
      });
    }

    // Select random match from online available users
    const randomMatch = matches[Math.floor(Math.random() * matches.length)];

    res.json({ match: randomMatch });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: 'Failed to find match' });
  }
});

export default router;
