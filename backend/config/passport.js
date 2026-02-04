import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0]?.value || '',
        skills: [],
        bio: '',
        isAvailable: true,
        lastLogin: new Date()
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  console.log('🔵 Serializing user:', user.id);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  console.log('🔵 Deserializing user ID:', id);
  try {
    const user = await User.findByPk(id);
    console.log('🔵 User found:', user ? user.id : 'NOT FOUND');
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialize error:', error);
    done(error, null);
  }
});

export default passport;
