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
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/index.html?error=auth_failed` 
  }),
  (req, res) => {
    // Successful authentication
    // Set a temporary flag in session to confirm auth
    req.session.justAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/index.html?error=session_error`);
      }
      // Redirect to frontend dashboard
      res.redirect(`${process.env.FRONTEND_URL}/dashboard.html`);
    });
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
  // Debug logging
  console.log('Session ID:', req.sessionID);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('Session:', req.session);
  console.log('User:', req.user);
  
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
