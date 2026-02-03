# 🎓 Learn Loop Platform

A premium, frontend-only website for a "Teach-to-Learn" platform where users can learn by teaching and teach by learning.

![Learn Loop](https://img.shields.io/badge/Version-1.0.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 🌟 Features

- **Clean, Modern Design**: Professional UI with gradient accents and smooth transitions
- **Fully Responsive**: Mobile-first design that looks great on all devices
- **Google Login UI**: Ready-to-integrate Google OAuth button (backend connection needed)
- **Smooth Animations**: Intersection Observer API for scroll-based animations
- **Semantic HTML**: SEO-friendly and accessible markup
- **CSS Variables**: Easy theming and customization
- **Zero Dependencies**: Pure HTML, CSS, and vanilla JavaScript

## 🚀 Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/workwithaaditya/Learn-Loop.git
cd Learn-Loop
```

2. Open `index.html` in your browser:
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
