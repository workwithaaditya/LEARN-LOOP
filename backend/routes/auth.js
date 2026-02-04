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
    console.log('🔐 OAuth Callback - User authenticated');
    console.log('User from passport:', req.user);
    console.log('Session before save:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    
    if (!req.user) {
      console.error('❌ No user in request after passport authentication');
      return res.redirect(`${process.env.FRONTEND_URL}/index.html?error=no_user`);
    }
    
    // Successful authentication
    req.session.justAuthenticated = true;
    req.session.userId = req.user.id; // Store user ID directly in session
    
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/index.html?error=session_error`);
      }
      console.log('✅ Session saved successfully');
      console.log('Session after save:', req.session);
      console.log('Session ID:', req.sessionID);
      
      // Redirect with session ID in URL as backup
      const redirectUrl = `${process.env.FRONTEND_URL}/dashboard.html?sid=${req.sessionID}`;
      res.redirect(redirectUrl);
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
router.get('/current-user', async (req, res) => {
  // Debug logging
  console.log('=== Auth Check ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session Cookie:', req.headers.cookie);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('Session User:', req.session?.passport?.user);
  console.log('Req User:', req.user);
  console.log('Origin:', req.headers.origin);
  
  // Check if authenticated via Passport
  if (req.isAuthenticated() && req.user) {
    return res.json({
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
  }
  
  // Fallback: Check if userId stored in session (for cookie issues)
  if (req.session?.userId) {
    console.log('🔄 Using fallback - userId from session:', req.session.userId);
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByPk(req.session.userId);
      
      if (user) {
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            skills: user.skills,
            bio: user.bio,
            isAvailable: user.isAvailable
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  
  console.log('❌ Not authenticated - Missing session or user');
  res.json({ authenticated: false });
});

// @route   GET /auth/test-session
// @desc    Test session persistence
router.get('/test-session', (req, res) => {
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  
  res.json({
    sessionID: req.sessionID,
    views: req.session.views,
    authenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    cookie: req.session.cookie
  });
});

export default router;
