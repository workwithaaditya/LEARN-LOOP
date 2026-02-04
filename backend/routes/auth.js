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
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/index.html?error=session_error`);
      }
      console.log('✅ Session saved successfully');
      console.log('Session after save:', req.session);
      console.log('Session ID:', req.sessionID);
      
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
  console.log('=== Auth Check ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session Cookie:', req.headers.cookie);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('Session User:', req.session?.passport?.user);
  console.log('Req User:', req.user);
  console.log('Origin:', req.headers.origin);
  
  if (req.isAuthenticated() && req.user) {
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
    console.log('❌ Not authenticated - Missing session or user');
    res.json({ authenticated: false });
  }
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
