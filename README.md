# 🎓 Learn Loop Platform

A premium platform for a "Teach-to-Learn" concept where users can learn by teaching and teach by learning. Features Google OAuth authentication, real-time user matching, and video call capabilities.

![Learn Loop](https://img.shields.io/badge/Version-1.0.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)

## 🌟 Features

### Frontend
- **Clean, Modern Design**: Professional UI with red/yellow gradient accents
- **Dark/Light Mode**: Toggle between themes with localStorage persistence
- **Fully Responsive**: Mobile-first design that looks great on all devices
- **Smooth Animations**: Intersection Observer API for scroll-based animations
- **Zero Dependencies**: Pure HTML, CSS, and vanilla JavaScript

### Backend
- **Google OAuth 2.0**: Secure authentication with Google accounts
- **PostgreSQL Database**: Reliable and scalable data storage (Railway compatible)
- **Real-time Features**: Socket.io for instant messaging and status updates
- **User Profiles**: Skills, bio, availability status
- **Random Video Matching**: Skill-based matching with skip functionality
- **WebRTC Video Calls**: Peer-to-peer video communication

## 🚀 Quick Start

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Open `index.html` with Live Server or any local server on port 5500

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
npm install
```

2. Set up PostgreSQL on Railway (see backend/README.md)

3. Configure environment variables in `.env`

4. Start server:
```bash
npm run dev
```

## 📁 Project Structure

```
Learn-Loop/
├── frontend/
│   ├── index.html          # Landing page
│   ├── dashboard.html      # User dashboard
│   ├── styles.css          # Main styles
│   ├── dashboard.css       # Dashboard styles
│   ├── script.js           # Landing page logic
│   ├── dashboard.js        # Dashboard logic
│   └── favicon.png         # Favicon
├── backend/
│   ├── config/
│   │   ├── database.js     # PostgreSQL connection
│   │   └── passport.js     # Google OAuth config
│   ├── models/
│   │   └── User.js         # User model (Sequelize)
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── users.js        # User CRUD routes
│   │   └── match.js        # Matching algorithm
│   ├── socket/
│   │   └── socketHandler.js # WebSocket events
│   ├── middleware/
│   │   └── auth.js         # Auth middleware
│   ├── server.js           # Express server
│   ├── package.json
│   └── .env                # Environment variables
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Socket.io Client
- WebRTC for video calls

### Backend
- **Node.js** & **Express.js**
- **PostgreSQL** with **Sequelize ORM**
- **Passport.js** for Google OAuth
- **Socket.io** for real-time features
- **WebRTC** for video calling

## 🔧 Configuration

### Frontend Configuration
- Update API URL in `dashboard.js` if needed (default: `http://localhost:5000`)

### Backend Configuration
1. Create `.env` file in backend directory
2. Add required environment variables (see backend/.env.example)

## 🎯 How It Works

1. **Login**: Users authenticate with Google OAuth
2. **Profile Setup**: Add skills you want to teach/learn
3. **Browse Users**: See all available users with their skills
4. **Ping Users**: Send connection requests to specific users
5. **Random Video Call**: Get matched with users based on skill compatibility
6. **Video Chat**: Learn or teach via WebRTC video calls
7. **Skip Feature**: Skip to next random match anytime

## 📱 Features in Detail

### User Dashboard
- Profile management with avatar, bio, and skills
- Availability toggle
- Real-time user list
- Ping/message functionality
- Random video call matching

### Video Calls
- Skill-based matching algorithm
- WebRTC peer-to-peer connection
- Camera/microphone controls
- Skip to next match
- End call functionality

## 🚀 Deployment

### Frontend
- Deploy to Netlify, Vercel, or GitHub Pages
- Update `FRONTEND_URL` in backend `.env`

### Backend
- Deploy to Railway.app (recommended)
- PostgreSQL automatically provisioned
- Set environment variables in Railway dashboard

## 📝 API Endpoints

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/current-user` - Get logged-in user
- `GET /api/users` - Get all available users
- `PUT /api/users/profile` - Update profile
- `POST /api/match/find` - Find random match

## 🔌 WebSocket Events

- `user:join` - User connects
- `user:ping` - Send message
- `call:initiate` - Start video call
- `call:answer` - Answer call
- `call:end` - End call

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👨‍💻 Author

**workwithaaditya**
- GitHub: [@workwithaaditya](https://github.com/workwithaaditya)

## 🙏 Acknowledgments

- Google OAuth for authentication
- Socket.io for real-time features
- WebRTC for video calling
- Railway for database hosting
```bash
# On Windows
start index.html

# On Mac
open index.html

# Or use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

### Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Select branch `main` and folder `/root`
4. Click Save
5. Your site will be live at `https://workwithaaditya.github.io/Teachandlearn/`

## 📁 Project Structure

```
TeachAndLearn/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles with design system
├── script.js           # JavaScript functionality
└── README.md          # Documentation
```

## 🎨 Design System

### Colors
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#8b5cf6` (Violet)
- **Background**: `#fafbfc` (Off-white)
- **Surface**: `#ffffff` (White)

### Typography
- **Font Family**: Plus Jakarta Sans
- **Sizes**: Responsive from 0.875rem to 3rem

### Components
- Navigation Bar (sticky)
- Hero Section with gradient text
- Value Proposition Cards
- How It Works Steps
- CTA Section
- Footer
- Login Modal

## 🔐 Google OAuth Integration

The Google Login button is currently **UI-only**. To connect actual authentication:

### Step 1: Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins
6. Add authorized redirect URIs

### Step 2: Add Google Sign-In Library

Add this script to `index.html` before closing `</body>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Step 3: Update JavaScript

Replace the `handleGoogleLogin` function in `script.js`:

```javascript
function handleGoogleLogin() {
    google.accounts.id.initialize({
        client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        callback: handleCredentialResponse
    });
    google.accounts.id.prompt();
}

function handleCredentialResponse(response) {
    // Send response.credential (JWT) to your backend
    console.log("Encoded JWT ID token: " + response.credential);
    
    // Example: Send to backend
    fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        // Handle successful login
        window.location.href = '/dashboard';
    });
}
```

### Step 4: Backend Requirements

Your backend should:
1. Verify the Google JWT token
2. Extract user information (name, email, photo)
3. Create/update user in your database
4. Create a session/JWT for your application
5. Return authentication status

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## 🎯 Key Sections

### 1. Hero Section
- Gradient headline text
- Clear value proposition
- Primary and secondary CTAs
- Floating card animations

### 2. Value Proposition
- Three feature cards (Learn, Teach, Track)
- Featured card with badge
- Icon-based design
- Hover effects

### 3. How It Works
- Step-by-step process
- Numbered indicators
- Clean visual flow

### 4. CTA Section
- Gradient background
- Clear call-to-action
- Large CTA button

### 5. Footer
- Brand information
- Link columns
- Social media icons
- Copyright notice

## 🛠️ Customization

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --color-primary: #6366f1;
    --color-secondary: #8b5cf6;
    /* ... other variables */
}
```

### Change Fonts

Update the Google Fonts link in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font:wght@400;600;700&display=swap" rel="stylesheet">
```

Then update the CSS variable:

```css
:root {
    --font-family: 'Your Font', sans-serif;
}
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📧 Contact

**Aaditya**
- GitHub: [@workwithaaditya](https://github.com/workwithaaditya)

---

Made with ❤️ for learners and teachers worldwide
