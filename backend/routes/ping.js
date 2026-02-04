import express from 'express';
import Ping from '../models/Ping.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/ping/received
// @desc    Get all pings received by current user
router.get('/received', isAuthenticated, async (req, res) => {
  try {
    const pings = await Ping.findAll({
      where: { receiverId: req.user.id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to recent 50 pings for efficiency
    });

    const unreadCount = await Ping.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });

    res.json({
      pings,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching pings:', error);
    res.status(500).json({ error: 'Failed to fetch pings' });
  }
});

// @route   PUT /api/ping/:id/read
// @desc    Mark a ping as read
router.put('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const ping = await Ping.findOne({
      where: {
        id: req.params.id,
        receiverId: req.user.id
      }
    });

    if (!ping) {
      return res.status(404).json({ error: 'Ping not found' });
    }

    await ping.update({ isRead: true });

    res.json({ message: 'Ping marked as read', ping });
  } catch (error) {
    console.error('Error marking ping as read:', error);
    res.status(500).json({ error: 'Failed to update ping' });
  }
});

// @route   PUT /api/ping/mark-all-read
// @desc    Mark all pings as read for current user
router.put('/mark-all-read', isAuthenticated, async (req, res) => {
  try {
    await Ping.update(
      { isRead: true },
      {
        where: {
          receiverId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({ message: 'All pings marked as read' });
  } catch (error) {
    console.error('Error marking all pings as read:', error);
    res.status(500).json({ error: 'Failed to update pings' });
  }
});

// @route   DELETE /api/ping/:id
// @desc    Delete a ping (optional cleanup feature)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const result = await Ping.destroy({
      where: {
        id: req.params.id,
        receiverId: req.user.id
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Ping not found' });
    }

    res.json({ message: 'Ping deleted' });
  } catch (error) {
    console.error('Error deleting ping:', error);
    res.status(500).json({ error: 'Failed to delete ping' });
  }
});

export default router;
