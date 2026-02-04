import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import database
import sequelize from './config/database.js';
import User from './models/User.js';
import Ping from './models/Ping.js';
import Friendship from './models/Friendship.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/match.js';
import { setIoInstance } from './routes/match.js';
import pingRoutes from './routes/ping.js';
import friendsRoutes from './routes/friends.js';

// Import socket handler
import { setupSocketHandlers } from './socket/socketHandler.js';

// Import passport config
import './config/passport.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// PostgreSQL session store
const PgSession = connectPgSimple(session);

// Trust Railway proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with PostgreSQL store
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Trust Railway proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
    partitioned: true // Enable partitioned cookies for better browser compatibility
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected successfully');
    return sequelize.sync({ alter: true }); // Creates/updates tables
  })
  .then(() => {
    console.log('✅ Database tables synced');
  })
  .catch(err => console.error('❌ Database connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/ping', pingRoutes);
app.use('/api/friends', friendsRoutes);

// ICE servers endpoint for WebRTC (STUN + TURN)
app.get('/api/ice', async (req, res) => {
  try {
    const meteredApiKey = process.env.METERED_API_KEY || 'af10e31f617aa49eb4024c3e52fcfae6eaa6';
    
    // Fetch TURN credentials from Metered
    const response = await fetch(
      `https://learnloop.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`
    );
    
    const iceServers = await response.json();
    
    res.json({ iceServers });
  } catch (error) {
    console.error('Error fetching ICE servers:', error);
    // Fallback to basic STUN if Metered API fails
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Learn Loop Backend Server is running',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Pass io instance to match routes for real-time online user filtering
setIoInstance(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🗄️  Database: PostgreSQL`);
});
