# 🎓 Learn Loop - Teach to Learn Platform

> A real-time peer learning platform where users can teach what they know and learn what they don't. Connect with people worldwide through skill-based video calls and grow together!

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://learn-loop-ten.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Railway-blueviolet?style=for-the-badge)](https://learn-loop-production.up.railway.app)

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?logo=webrtc&logoColor=white)

---

## 🌟 Key Features

### 🔐 **Secure Authentication**
- Google OAuth 2.0 integration
- Session-based authentication with secure cookies
- Cross-origin support for seamless login

### 👥 **Social Features**
- **Friends System**: Send/accept friend requests
- **Real-time Presence**: See who's online instantly
- **Ping Notifications**: Get notified when someone wants to connect
- **User Profiles**: View skills, bio, and availability status
- **Search & Filter**: Find users by name or skills

### 🎥 **Video Calling**
- **Random Skill-Based Matching**: Connect with users who share your interests
- **WebRTC P2P Video Calls**: High-quality peer-to-peer video
- **TURN Server Integration**: Works even on restrictive networks (Metered.ca)
- **50-50 Split Screen**: Equal space for both participants
- **Seamless Skip**: Find a new match without leaving the call
- **Motivational Quotes**: Inspiring messages while connecting
- **Camera/Mic Controls**: Toggle video and audio anytime

### ⚡ **Real-time Updates**
- Socket.io powered instant messaging
- Live user status changes
- Online/offline indicators
- Presence tracking

### 🎨 **Modern UI/UX**
- Dark/Light mode toggle
- Smooth animations and transitions
- Fully responsive design (mobile, tablet, desktop)
- Clean, intuitive interface
- Glassmorphism effects

---

## 🚀 Live Demo

**Frontend**: [https://learn-loop-ten.vercel.app/](https://learn-loop-ten.vercel.app/)  
**Backend**: [https://learn-loop-production.up.railway.app](https://learn-loop-production.up.railway.app)

---

## 🛠️ Tech Stack

### **Frontend**
- **HTML5, CSS3, JavaScript (ES6+)**: Modern vanilla JavaScript
- **Socket.io Client**: Real-time bidirectional communication
- **WebRTC**: Peer-to-peer video calling
- **Vercel**: Deployment platform

### **Backend**
- **Node.js & Express.js**: RESTful API server
- **PostgreSQL**: Relational database
- **Sequelize ORM**: Database modeling and queries
- **Passport.js**: Google OAuth authentication
- **Socket.io**: WebSocket server
- **Railway**: Cloud hosting with PostgreSQL

### **Services**
- **Metered.ca**: TURN/STUN servers for WebRTC
- **Google Cloud**: OAuth 2.0 authentication

---

## 📁 Project Structure

```
Learn-Loop/
├── frontend/
│   ├── index.html              # Landing page
│   ├── dashboard.html          # Main dashboard
│   ├── styles.css              # Landing page styles
│   ├── dashboard.css           # Dashboard styles
│   ├── script.js               # Landing page logic
│   └── dashboard.js            # Dashboard & WebRTC logic
│
├── backend/
│   ├── config/
│   │   ├── database.js         # PostgreSQL connection
│   │   └── passport.js         # Google OAuth strategy
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Ping.js             # Notification model
│   │   └── Friendship.js       # Friends model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User CRUD operations
│   │   ├── match.js            # Random matching algorithm
│   │   ├── ping.js             # Notification routes
│   │   └── friends.js          # Friend requests routes
│   ├── socket/
│   │   └── socketHandler.js    # Socket.io event handlers
│   ├── middleware/
│   │   └── auth.js             # Auth middleware
│   ├── server.js               # Express server entry
│   ├── package.json
│   └── .env                    # Environment variables
│
└── README.md
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (or Railway account)
- Google Cloud Console account (for OAuth)
- Metered.ca account (for TURN servers)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/workwithaaditya/LEARN-LOOP.git
cd LEARN-LOOP
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Database (Railway PostgreSQL URL)
DATABASE_URL=postgresql://user:password@host:port/database

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session
SESSION_SECRET=your-random-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:5500

# Environment
NODE_ENV=development

# Metered TURN Service
METERED_API_KEY=your-metered-api-key
```

Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd frontend
```

Update `API_URL` in `dashboard.js`:

```javascript
const API_URL = 'http://localhost:5000'; // Local development
// or
const API_URL = 'https://learn-loop-production.up.railway.app'; // Production
```

Serve frontend (use Live Server on port 5500):

```bash
# Using VS Code Live Server
# Or using Python
python -m http.server 5500

# Or using Node.js http-server
npx http-server -p 5500
```

Visit `http://localhost:5500`

---

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google+ API**
4. Create **OAuth 2.0 Credentials**
5. Add Authorized JavaScript origins:
   - `http://localhost:5500` (development)
   - `https://learn-loop-ten.vercel.app` (production)
6. Add Authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
   - `https://learn-loop-production.up.railway.app/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

---

## 📡 TURN Server Setup (Metered.ca)

1. Sign up at [Metered.ca](https://www.metered.ca/)
2. Create a new app
3. Copy your API key
4. Add `METERED_API_KEY` to Railway environment variables
5. Backend automatically fetches TURN credentials

**Why TURN?** Enables video calls on restrictive networks (corporate firewalls, symmetric NATs)

---

## 🚀 Deployment

### Deploy Backend to Railway

1. Create account at [Railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Add environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `FRONTEND_URL` (your Vercel URL)
   - `NODE_ENV=production`
   - `METERED_API_KEY`
5. Railway auto-provisions PostgreSQL
6. Copy `DATABASE_URL` from Railway
7. Deploy!

### Deploy Frontend to Vercel

1. Create account at [Vercel](https://vercel.com)
2. Click **New Project** → Import from GitHub
3. Select `frontend` folder as root
4. Deploy!
5. Update `FRONTEND_URL` in Railway environment variables

---

## 📝 API Documentation

### **Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| GET | `/auth/current-user` | Get logged-in user |
| GET | `/auth/logout` | Logout user |

### **Users**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all available users |
| PUT | `/api/users/profile` | Update user profile |

### **Matching**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/find` | Find random skill-based match |

### **Pings (Notifications)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping/received` | Get user's pings |
| PUT | `/api/ping/:id/read` | Mark ping as read |
| PUT | `/api/ping/mark-all-read` | Mark all as read |

### **Friends**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get friends & requests |
| POST | `/api/friends/send` | Send friend request |
| PUT | `/api/friends/:id/accept` | Accept request |
| PUT | `/api/friends/:id/reject` | Reject request |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends/check/:userId` | Check friendship status |

### **WebRTC**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ice` | Get TURN/STUN credentials |

---

## 🔌 Socket.io Events

### **Connection**

- `user:join` - User connects to socket
- `disconnect` - User disconnects

### **Status**

- `user:status-change` - User online/offline
- `users:updated` - User list updated

### **Pings**

- `user:ping` - Send ping notification
- `ping:received` - Receive ping

### **Video Calls**

- `call:initiate` - Start call with offer
- `call:incoming` - Receive call request
- `call:answer` - Answer call with SDP
- `call:answered` - Receive answer
- `call:ice-candidate` - Exchange ICE candidates
- `call:declined` - Call declined
- `call:end` - End call

---

## 🎯 How It Works

### 1️⃣ **Sign Up / Login**
- Click "Get Started" or "Login with Google"
- Authenticate with Google OAuth
- Automatic account creation

### 2️⃣ **Set Up Profile**
- Add skills you know or want to learn
- Write a bio
- Toggle availability status

### 3️⃣ **Connect with Users**
- Browse online users
- Search by name or skills
- Send pings to specific users
- Add friends

### 4️⃣ **Start Video Calls**
- Click "Start Random Call" for skill-based matching
- Or call friends directly
- Camera/mic permissions required

### 5️⃣ **Learn & Teach**
- Talk about shared skills
- Skip to next match anytime
- End call when done

---

## 🎨 Features in Detail

### **Skill-Based Matching Algorithm**

```javascript
// Matches users based on:
// 1. Online status (Socket.io presence)
// 2. Availability flag
// 3. Shared skills (weighted scoring)
// 4. Not currently in a call
```

### **Real-time Presence**

```javascript
// Socket.io maintains onlineUsers Set
// Match API filters by actual connections
// No stale database flags
```

### **WebRTC with TURN Fallback**

```javascript
// Connection attempt order:
// 1. Direct P2P (host-host)
// 2. STUN (through NAT)
// 3. TURN (relay) - Metered.ca
```

---

## 🐛 Known Issues & Solutions

### **Issue**: Brave browser blocks cookies after Google login

**Solution**: 
1. Click Brave Shields icon
2. Allow cross-site cookies for Railway domain
3. Or use Chrome/Firefox

### **Issue**: Video call doesn't connect

**Solutions**:
- Check camera/mic permissions
- Ensure TURN credentials are set in Railway
- Check browser console for WebRTC errors
- Look for `relay` type ICE candidates

### **Issue**: "No users online" when users exist

**Solution**: Ensure Socket.io connection is active (check network tab)

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Aaditya**

- GitHub: [@workwithaaditya](https://github.com/workwithaaditya)
- Project: [Learn Loop](https://github.com/workwithaaditya/LEARN-LOOP)
- Live Demo: [https://learn-loop-ten.vercel.app/](https://learn-loop-ten.vercel.app/)

---

## 🙏 Acknowledgments

- **Google Cloud Platform** - OAuth authentication
- **Railway** - Backend hosting & PostgreSQL
- **Vercel** - Frontend deployment
- **Metered.ca** - TURN/STUN servers
- **Socket.io** - Real-time communication
- **WebRTC** - Video calling technology

---

## 📞 Support

Having issues? Found a bug?

- Open an [Issue](https://github.com/workwithaaditya/LEARN-LOOP/issues)
- Check existing issues first
- Provide detailed reproduction steps

---

## 🎯 Roadmap

- [ ] Group video calls (3+ people)
- [ ] Text chat during calls
- [ ] Screen sharing
- [ ] Session recordings
- [ ] Learning progress tracking
- [ ] Skill ratings & reviews
- [ ] Scheduled calls
- [ ] Mobile app (React Native)

---

## 📊 Stats

![GitHub repo size](https://img.shields.io/github/repo-size/workwithaaditya/LEARN-LOOP)
![GitHub stars](https://img.shields.io/github/stars/workwithaaditya/LEARN-LOOP?style=social)
![GitHub forks](https://img.shields.io/github/forks/workwithaaditya/LEARN-LOOP?style=social)

---

**Made with ❤️ by Aaditya | Empowering learners worldwide 🌍**
