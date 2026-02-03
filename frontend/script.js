// ============================================
// LEARN LOOP - FRONTEND JAVASCRIPT
// ============================================

// ============================================
// THEME TOGGLE FUNCTIONALITY
// ============================================

// Get theme toggle button
const themeToggle = document.getElementById('themeToggle');

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ============================================
// GOOGLE LOGIN FUNCTIONALITY
// ============================================

/**
 * IMPORTANT: Google OAuth Integration
 * 
 * This is currently UI-only. To connect actual Google OAuth:
 * 
 * 1. Set up Google Cloud Console:
 *    - Go to console.cloud.google.com
 *    - Create a new project
 *    - Enable Google+ API
 *    - Create OAuth 2.0 credentials
 *    - Add authorized JavaScript origins (your domain)
 *    - Add authorized redirect URIs
 * 
 * 2. Add Google Sign-In library:
 *    <script src="https://accounts.google.com/gsi/client" async defer></script>
 * 
 * 3. Replace the handleGoogleLogin function with:
 *    function handleGoogleLogin() {
 *        google.accounts.id.initialize({
 *            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
 *            callback: handleCredentialResponse
 *        });
 *        google.accounts.id.prompt();
 *    }
 * 
 * 4. Add credential response handler:
 *    function handleCredentialResponse(response) {
 *        // Send response.credential (JWT) to your backend
 *        // Backend verifies the token and creates session
 *    }
 * 
 * 5. Backend requirements:
 *    - Verify Google JWT token
 *    - Extract user information
 *    - Create/update user in database
 *    - Create session/JWT for your app
 */

// DOM Elements
const googleLoginBtn = document.getElementById('googleLoginBtn');
const loginModal = document.getElementById('loginModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

// Modal Login Buttons (inside modal)
const modalLoginButtons = document.querySelectorAll('.modal-body .btn-google-login');

// ============================================
// EVENT LISTENERS
// ============================================

// Open login modal when clicking navbar login button
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', openLoginModal);
}

// Close modal when clicking overlay
if (modalOverlay) {
    modalOverlay.addEventListener('click', closeLoginModal);
}

// Close modal when clicking close button
if (modalClose) {
    modalClose.addEventListener('click', closeLoginModal);
}

// Handle modal login button clicks
modalLoginButtons.forEach(button => {
    button.addEventListener('click', handleGoogleLogin);
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.classList.contains('active')) {
        closeLoginModal();
    }
});

// ============================================
// MODAL FUNCTIONS
// ============================================

function openLoginModal() {
    if (loginModal) {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// ============================================
// LOGIN HANDLER (Placeholder)
// ============================================

function handleGoogleLogin() {
    // Redirect to Google OAuth
    window.location.href = 'https://surprising-sparkle-production.up.railway.app/auth/google';
}

// ============================================
// SMOOTH SCROLL FOR NAVIGATION
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// CTA BUTTONS HANDLER
// ============================================

// Handle "Start Learning" and "Get Started" buttons
const ctaButtons = document.querySelectorAll('.btn-primary:not(.btn-google-login)');
ctaButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Open login modal when CTA is clicked
        openLoginModal();
    });
});

// Handle "Learn How It Works" button
const secondaryButtons = document.querySelectorAll('.btn-secondary');
secondaryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Scroll to "How It Works" section
        const howItWorksSection = document.querySelector('.how-it-works');
        if (howItWorksSection) {
            howItWorksSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add shadow when scrolled
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

// Add fade-in animation for sections as they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all value cards and steps
document.querySelectorAll('.value-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ============================================
// CONSOLE MESSAGE
// ============================================

console.log('%cTeachAndLearn Platform', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cFrontend-only version - Backend integration pending', 'font-size: 12px; color: #718096;');
console.log('%c\nTo integrate Google OAuth:', 'font-size: 14px; font-weight: bold; color: #1a202c;');
console.log('1. Set up Google Cloud Console');
console.log('2. Add Google Sign-In library');
console.log('3. Implement handleCredentialResponse');
console.log('4. Create backend authentication endpoint');
console.log('\nSee comments in script.js for detailed instructions.');
