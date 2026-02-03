import express from 'express';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all available users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { 
        id: { [Op.ne]: req.user.id },
        isAvailable: true 
      },
      attributes: ['id', 'name', 'email', 'avatar', 'skills', 'bio', 'isAvailable', 'inCall'],
      order: [['lastLogin', 'DESC']],
      limit: 50
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'avatar', 'skills', 'bio', 'isAvailable', 'inCall']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { name, bio, skills, isAvailable } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'avatar', 'skills', 'bio', 'isAvailable']
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by skill
router.get('/search/skills', isAuthenticated, async (req, res) => {
  try {
    const { skill } = req.query;

    if (!skill) {
      return res.status(400).json({ error: 'Skill parameter is required' });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
        isAvailable: true,
        skills: { [Op.contains]: [skill] }
      },
      attributes: ['id', 'name', 'email', 'avatar', 'skills', 'bio', 'isAvailable', 'inCall'],
      limit: 20
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
