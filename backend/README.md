# Learn Loop Backend

Backend server for Learn Loop platform with Google OAuth, real-time messaging, and video call matching.

**Database: PostgreSQL** (Railway compatible)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up PostgreSQL Database on Railway

**Option A: Railway (Recommended - Free)**

1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Provision PostgreSQL"**
5. Click on database → **"Variables"** tab
6. Copy **DATABASE_URL** or **POSTGRES_URL**

**Option B: Local PostgreSQL (For offline development)**

- Download from https://www.postgresql.org/download/
- Install and start PostgreSQL service
- Connection string: `postgresql://postgres:password@localhost:5432/learn_loop`

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add Authorized JavaScript origins:
   - `http://localhost:5500`
   - `http://localhost:5000`
6. Add Authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
7. Copy Client ID and Client Secret

### 4. Configure Environment Variables

Edit `.env` file with your credentials:

```env
PORT=5000
NODE_ENV=development

# Use your Railway PostgreSQL URL
DATABASE_URL=postgresql://username:password@hostname:5432/dbname

GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

SESSION_SECRET=your_very_long_random_secret_here_at_least_32_characters

FRONTEND_URL=http://localhost:5500
```

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

### 6. Start Frontend

Open `index.html` with Live Server or any local server on port 5500.

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/current-user` - Get logged in user
- `GET /auth/logout` - Logout

### Users
- `GET /api/users` - Get all available users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search/skills?skill=javascript` - Search by skill

### Matching
- `POST /api/match/find` - Find random match based on skills

## WebSocket Events

### Client → Server
- `user:join` - User connects with userId
- `user:ping` - Send ping to another user
- `call:initiate` - Start video call
- `call:answer` - Answer incoming call
- `call:ice-candidate` - Send ICE candidate
- `call:end` - End call
- `call:skip` - Skip current match

### Server → Client
- `users:updated` - User list changed
- `user:ping-received` - Received ping from user
- `call:incoming` - Incoming video call
- `call:answered` - Call answered
- `call:ice-candidate` - ICE candidate received
- `call:ended` - Call ended by other user

## Features

✅ Google OAuth 2.0 authentication
✅ User profiles with skills
✅ Real-time user list
✅ Ping/message other users
✅ Random video call matching based on skills
✅ Skip to next match
✅ WebRTC peer-to-peer video calls
✅ Socket.io for real-time features

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Passport.js** - Authentication
- **Socket.io** - Real-time communication
- **WebRTC** - Video calling

## Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running: `mongod`
- Check connection string in `.env`

**Google OAuth Error:**
- Verify Client ID and Secret
- Check authorized origins and redirect URIs
- Make sure callback URL matches exactly

**CORS Error:**
- Frontend must be on port 5500
- Check FRONTEND_URL in `.env`

**Video Call Not Working:**
- Allow camera/microphone permissions
- Check browser console for errors
- Ensure HTTPS in production (HTTP ok for localhost)
