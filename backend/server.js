import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import database
import sequelize from './config/database.js';
import User from './models/User.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/match.js';

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

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Trust Railway proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
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
