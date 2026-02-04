import express from 'express';
import Friendship from '../models/Friendship.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// @route   POST /api/friends/send
// @desc    Send friend request
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === addresseeId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendship = await Friendship.create({
      requesterId,
      addresseeId,
      status: 'pending'
    });

    res.json({ message: 'Friend request sent', friendship });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// @route   GET /api/friends
// @desc    Get all friends and pending requests
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get accepted friends
    const friends = await Friendship.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId, status: 'accepted' },
          { addresseeId: userId, status: 'accepted' }
        ]
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar', 'skills', 'isAvailable', 'inCall']
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'name', 'email', 'avatar', 'skills', 'isAvailable', 'inCall']
        }
      ]
    });

    // Get pending requests (received)
    const pendingRequests = await Friendship.findAll({
      where: {
        addresseeId: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'email', 'avatar', 'skills']
      }]
    });

    // Get sent requests
    const sentRequests = await Friendship.findAll({
      where: {
        requesterId: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'addressee',
        attributes: ['id', 'name', 'email', 'avatar', 'skills']
      }]
    });

    // Format friends list
    const friendsList = friends.map(f => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        ...friend.toJSON()
      };
    });

    res.json({
      friends: friendsList,
      pendingRequests: pendingRequests.map(r => ({
        id: r.id,
        requester: r.requester,
        createdAt: r.createdAt
      })),
      sentRequests: sentRequests.map(r => ({
        id: r.id,
        addressee: r.addressee,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// @route   PUT /api/friends/:id/accept
// @desc    Accept friend request
router.put('/:id/accept', isAuthenticated, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        id: req.params.id,
        addresseeId: req.user.id,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendship.update({ status: 'accepted' });

    res.json({ message: 'Friend request accepted', friendship });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// @route   PUT /api/friends/:id/reject
// @desc    Reject friend request
router.put('/:id/reject', isAuthenticated, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        id: req.params.id,
        addresseeId: req.user.id,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendship.destroy();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// @route   DELETE /api/friends/:id
// @desc    Remove friend
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const result = await Friendship.destroy({
      where: {
        id: req.params.id,
        [Op.or]: [
          { requesterId: req.user.id },
          { addresseeId: req.user.id }
        ]
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// @route   GET /api/friends/check/:userId
// @desc    Check friendship status with a user
router.get('/check/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId: currentUserId, addresseeId: userId },
          { requesterId: userId, addresseeId: currentUserId }
        ]
      }
    });

    if (!friendship) {
      return res.json({ status: 'none' });
    }

    const isSender = friendship.requesterId === currentUserId;
    
    res.json({
      status: friendship.status,
      friendshipId: friendship.id,
      isSender
    });
  } catch (error) {
    console.error('Error checking friendship:', error);
    res.status(500).json({ error: 'Failed to check friendship status' });
  }
});

export default router;
