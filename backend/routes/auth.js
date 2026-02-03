import express from 'express';
import passport from 'passport';

const router = express.Router();

// @route   GET /auth/google
// @desc    Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard.html`);
  }
);

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// @route   GET /auth/current-user
// @desc    Get current logged in user
router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        skills: req.user.skills,
        bio: req.user.bio,
        isAvailable: req.user.isAvailable
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
