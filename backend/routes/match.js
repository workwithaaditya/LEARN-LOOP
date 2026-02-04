import express from 'express';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Store io instance reference
let ioInstance = null;

// Queue for waiting users
const waitingQueue = new Map(); // userId -> { user, timestamp, socketId }

export const setIoInstance = (io) => {
  ioInstance = io;
};

// Helper to remove user from queue
export const removeFromQueue = (userId) => {
  waitingQueue.delete(userId);
};

// Helper to get next user from queue
const getNextFromQueue = (excludeUserId) => {
  for (const [userId, data] of waitingQueue.entries()) {
    if (userId !== excludeUserId) {
      waitingQueue.delete(userId);
      return data.user;
    }
  }
  return null;
};

// @route   POST /api/match/join-queue
// @desc    Join the waiting queue for random matching
router.post('/join-queue', isAuthenticated, async (req, res) => {
  try {
    const currentUser = req.user;
    const { socketId } = req.body;

    // Check if there's someone already waiting in queue
    const waitingUser = getNextFromQueue(currentUser.id);
    
    if (waitingUser) {
      // Found a match! Notify both users
      await User.update({ inCall: true }, { where: { id: currentUser.id } });
      await User.update({ inCall: true }, { where: { id: waitingUser.id } });
      
      // Notify the waiting user they got a match
      if (ioInstance && waitingUser.socketId) {
        ioInstance.to(waitingUser.socketId).emit('match:found', {
          match: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            skills: currentUser.skills,
            bio: currentUser.bio,
            socketId: currentUser.socketId
          }
        });
      }
      
      return res.json({ 
        match: waitingUser,
        inQueue: false
      });
    } else {
      // No one waiting, add current user to queue
      waitingQueue.set(currentUser.id, {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          skills: currentUser.skills,
          bio: currentUser.bio,
          socketId: currentUser.socketId
        },
        timestamp: Date.now(),
        socketId: socketId || currentUser.socketId
      });
      
      return res.json({ 
        match: null,
        inQueue: true,
        queuePosition: waitingQueue.size
      });
    }
  } catch (error) {
    console.error('Queue join error:', error);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

// @route   POST /api/match/leave-queue
// @desc    Leave the waiting queue
router.post('/leave-queue', isAuthenticated, async (req, res) => {
  try {
    const currentUser = req.user;
    removeFromQueue(currentUser.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Queue leave error:', error);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
});

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
