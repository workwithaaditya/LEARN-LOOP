// Dashboard JavaScript
const API_URL = 'https://learn-loop-production.up.railway.app'; // Replace with actual Railway URL
const socket = io(API_URL, { withCredentials: true });

// Helper function to get auth headers
function getAuthHeaders() {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
}

let currentUser = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCallUser = null;
let allUsers = []; // Store all users for filtering
let isSearchingMatch = false;

const motivationalQuotes = [
  "You should be a learner always",
  "Every expert was once a beginner",
  "Learning is a journey, not a destination",
  "Knowledge grows when shared",
  "The best way to learn is to teach",
  "Stay curious, stay learning",
  "Connect, learn, grow together",
  "Your next mentor is just a call away"
];

function getRandomQuote() {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

// ICE configuration will be fetched dynamically
let iceServersConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Fetch ICE servers from backend
async function fetchIceServers() {
  try {
    const response = await fetch(`${API_URL}/api/ice`, { credentials: 'include' });
    const data = await response.json();
    iceServersConfig = data;
    console.log('ICE servers loaded:', iceServersConfig);
  } catch (error) {
    console.error('Failed to fetch ICE servers, using STUN only:', error);
  }
}

// DOM Elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userMenu = document.getElementById('userMenu');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const skillsList = document.getElementById('skillsList');
const usersList = document.getElementById('usersList');
const availabilityToggle = document.getElementById('availabilityToggle');
const quickSkillInput = document.getElementById('quickSkillInput');
const userSearchInput = document.getElementById('userSearchInput');
const startRandomCallBtn = document.getElementById('startRandomCallBtn');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');

// Ping/Notification elements
const pingsNotifBtn = document.getElementById('pingsNotifBtn');
const pingsBadge = document.getElementById('pingsBadge');
const pingsModal = document.getElementById('pingsModal');
const closePingsModal = document.getElementById('closePingsModal');
const closePingsBtn = document.getElementById('closePingsBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const pingsContainer = document.getElementById('pingsContainer');

// Profile Modal elements (for other users)
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const closeProfModalBtn = document.getElementById('closeProfModalBtn');
const friendActionBtn = document.getElementById('friendActionBtn');

// Self Profile Modal elements
const selfProfileModal = document.getElementById('selfProfileModal');
const closeSelfProfileModal = document.getElementById('closeSelfProfileModal');
const closeSelfProfBtn = document.getElementById('closeSelfProfBtn');

// Friends elements
const friendsList = document.getElementById('friendsList');
const friendRequests = document.getElementById('friendRequests');
const friendRequestsList = document.getElementById('friendRequestsList');
const refreshFriendsBtn = document.getElementById('refreshFriendsBtn');

// Modal elements
const videoModal = document.getElementById('videoModal');

// Video elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const videoInfo = document.getElementById('videoInfo');
const remoteLabel = document.getElementById('remoteLabel');
const motivationalQuote = document.getElementById('motivationalQuote');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');

// Message Box elements
const messageBoxBtn = document.getElementById('messageBoxBtn');
const messageBoxModal = document.getElementById('messageBoxModal');
const closeMessageBoxModal = document.getElementById('closeMessageBoxModal');
const closeMessageBoxBtn = document.getElementById('closeMessageBoxBtn');
const clearMessagesBtn = document.getElementById('clearMessagesBtn');
const messagesList = document.getElementById('messagesList');
const messageTabs = document.querySelectorAll('.message-tab');

// Message storage
let messagesStore = JSON.parse(localStorage.getItem('dashboardMessages') || '[]');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const skipCallBtn = document.getElementById('skipCallBtn');
const endCallBtn = document.getElementById('endCallBtn');

let unreadPingsCount = 0;

// Initialize
async function init() {
  try {
    // Check if redirected from OAuth with JWT token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('OAuth redirect detected with JWT token');
      // Store JWT token in localStorage
      localStorage.setItem('authToken', token);
      // Clean URL
      window.history.replaceState({}, document.title, '/dashboard.html');
    }
    
    // Get stored token
    const authToken = localStorage.getItem('authToken');
    
    // Check authentication
    console.log('Checking authentication...');
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Add JWT token to Authorization header if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('Using JWT token for authentication');
    }
    
    const authCheck = await fetch(`${API_URL}/auth/current-user`, {
      credentials: 'include',
      headers: headers
    });
    
    if (!authCheck.ok) {
      console.error('Auth check failed with status:', authCheck.status);
      localStorage.removeItem('authToken');
      window.location.href = '/index.html';
      return;
    }
    
    const authData = await authCheck.json();
    console.log('Auth response:', authData);
    
    if (!authData.authenticated) {
      console.log('Not authenticated, redirecting to login');
      localStorage.removeItem('authToken');
      window.location.href = '/index.html';
      return;
    }
    
    currentUser = authData.user;
    console.log('Authenticated user:', currentUser);
    displayUserInfo();
  
    // Fetch ICE servers (STUN + TURN)
    await fetchIceServers();
    
    // Join socket room
    socket.emit('user:join', { userId: currentUser.id });
    
    // Load users, friends, and pings
    loadUsers();
    loadFriends();
    loadPings();
    
    // Setup theme
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to load dashboard. Please try logging in again.');
    window.location.href = '/index.html';
  }
}

function displayUserInfo() {
  userAvatar.src = currentUser.avatar;
  userName.textContent = currentUser.name.split(' ')[0];
  
  profileAvatar.src = currentUser.avatar;
  profileName.textContent = currentUser.name;
  profileEmail.textContent = currentUser.email;
  
  availabilityToggle.checked = currentUser.isAvailable;
  
  displaySkills();
}

function displaySkills() {
  skillsList.innerHTML = '';
  if (currentUser.skills && currentUser.skills.length > 0) {
    currentUser.skills.forEach((skill, index) => {
      const skillItem = document.createElement('div');
      skillItem.className = 'skill-tag';
      skillItem.style.display = 'inline-flex';
      skillItem.style.alignItems = 'center';
      skillItem.style.gap = '0.5rem';
      
      const skillText = document.createElement('span');
      skillText.textContent = skill;
      
      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '&times;';
      removeBtn.style.background = 'none';
      removeBtn.style.border = 'none';
      removeBtn.style.color = 'inherit';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.fontSize = '1.2rem';
      removeBtn.style.padding = '0';
      removeBtn.style.marginLeft = '0.25rem';
      removeBtn.onclick = () => removeSkill(index);
      
      skillItem.appendChild(skillText);
      skillItem.appendChild(removeBtn);
      skillsList.appendChild(skillItem);
    });
  } else {
    skillsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.875rem;">No skills added yet</p>';
  }
}

async function removeSkill(index) {
  currentUser.skills.splice(index, 1);
  await updateSkills();
  displaySkills();
}

async function updateSkills() {
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ skills: currentUser.skills })
    });
    const data = await response.json();
    currentUser.skills = data.user.skills;
  } catch (error) {
    console.error('Error updating skills:', error);
  }
}

async function loadUsers() {
  usersList.innerHTML = '<p class="loading">Loading users...</p>';
  
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.users && data.users.length > 0) {
      allUsers = data.users;
      displayUsers(allUsers);
    } else {
      usersList.innerHTML = '<p class="no-users">No users available right now</p>';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = '<p class="no-users">Failed to load users</p>';
  }
}

function filterUsers(searchTerm) {
  if (!searchTerm.trim()) {
    displayUsers(allUsers);
    return;
  }
  
  const term = searchTerm.toLowerCase();
  
  // Fuzzy search function - matches partial strings and close words
  const fuzzyMatch = (text, search) => {
    if (!text) return false;
    text = text.toLowerCase();
    
    // Direct includes match
    if (text.includes(search)) return true;
    
    // Fuzzy matching - check if search chars appear in order
    let searchIndex = 0;
    for (let i = 0; i < text.length && searchIndex < search.length; i++) {
      if (text[i] === search[searchIndex]) {
        searchIndex++;
      }
    }
    if (searchIndex === search.length) return true;
    
    // Check similarity - if search is at least 70% contained in text
    const searchChars = search.split('');
    const matchCount = searchChars.filter(char => text.includes(char)).length;
    const similarity = matchCount / search.length;
    return similarity >= 0.7;
  };
  
  const filtered = allUsers.filter(user => {
    // Check name match with fuzzy search
    const nameMatch = fuzzyMatch(user.name, term);
    
    // Check skills match with fuzzy search
    const skillMatch = user.skills && user.skills.some(skill => 
      fuzzyMatch(skill, term)
    );
    
    return nameMatch || skillMatch;
  });
  
  displayUsers(filtered);
}

function displayUsers(users) {
  usersList.innerHTML = '';
  
  if (users.length === 0) {
    usersList.innerHTML = '<p class="no-users">No users found matching your search</p>';
    return;
  }
  
  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.onclick = () => openProfileModal(user);
    userItem.style.cursor = 'pointer';
    
    const userLeft = document.createElement('div');
    userLeft.className = 'user-item-left';
    
    const userImgContainer = document.createElement('div');
    userImgContainer.style.position = 'relative';
    
    const userImg = document.createElement('img');
    userImg.src = user.avatar;
    userImg.alt = user.name;
    
    // Add online status indicator
    const statusDot = document.createElement('div');
    statusDot.className = `status-indicator ${user.isAvailable ? 'status-online' : 'status-offline'}`;
    userImgContainer.appendChild(userImg);
    userImgContainer.appendChild(statusDot);
    
    const userInfo = document.createElement('div');
    userInfo.className = 'user-item-info';
    
    const userName = document.createElement('h4');
    userName.textContent = user.name;
    
    const userSkills = document.createElement('div');
    userSkills.className = 'user-item-skills';
    
    if (user.skills && user.skills.length > 0) {
      user.skills.slice(0, 3).forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'user-skill-tag';
        skillTag.textContent = skill;
        userSkills.appendChild(skillTag);
      });
    }
    
    userInfo.appendChild(userName);
    userInfo.appendChild(userSkills);
    
    userLeft.appendChild(userImgContainer);
    userLeft.appendChild(userInfo);
    
    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.style.display = 'flex';
    actionsContainer.style.gap = '0.5rem';
    actionsContainer.style.flexWrap = 'wrap';
    
    // Ping button
    const pingBtn = document.createElement('button');
    pingBtn.className = 'btn-secondary btn-sm';
    pingBtn.textContent = 'Ping';
    pingBtn.onclick = (e) => {
      e.stopPropagation();
      sendPing(user);
    };
    
    // Add Friend button
    const addFriendBtn = document.createElement('button');
    addFriendBtn.className = 'btn-primary btn-sm';
    addFriendBtn.textContent = 'Add Friend';
    addFriendBtn.onclick = (e) => {
      e.stopPropagation();
      sendFriendRequest(user.id);
    };
    
    actionsContainer.appendChild(pingBtn);
    actionsContainer.appendChild(addFriendBtn);
    
    userItem.appendChild(userLeft);
    userItem.appendChild(actionsContainer);
    
    usersList.appendChild(userItem);
  });
}

function pingUser(user) {
  socket.emit('user:ping', {
    toUserId: user.id,
    message: `${currentUser.name} wants to connect with you!`,
    fromUser: currentUser
  });
}

// Availability toggle
availabilityToggle.addEventListener('change', async (e) => {
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isAvailable: e.target.checked })
    });
    
    const data = await response.json();
    currentUser.isAvailable = data.user.isAvailable;
  } catch (error) {
    console.error('Error updating availability:', error);
  }
});

// Quick skill input with Enter key
quickSkillInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && quickSkillInput.value.trim()) {
    const newSkill = quickSkillInput.value.trim();
    if (!currentUser.skills.includes(newSkill)) {
      currentUser.skills.push(newSkill);
      await updateSkills();
      displaySkills();
      quickSkillInput.value = '';
    } else {
      showNotification('Skill already added!', 'warning');
    }
  }
});

// User search
userSearchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  const suggestionsContainer = document.getElementById('searchSuggestions');
  
  if (!searchTerm) {
    suggestionsContainer.classList.remove('active');
    suggestionsContainer.innerHTML = '';
    return;
  }
  
  // Filter users based on search term
  const term = searchTerm.toLowerCase();
  
  const fuzzyMatch = (text, search) => {
    if (!text) return false;
    text = text.toLowerCase();
    if (text.includes(search)) return true;
    
    let searchIndex = 0;
    for (let i = 0; i < text.length && searchIndex < search.length; i++) {
      if (text[i] === search[searchIndex]) {
        searchIndex++;
      }
    }
    if (searchIndex === search.length) return true;
    
    const searchChars = search.split('');
    const matchCount = searchChars.filter(char => text.includes(char)).length;
    const similarity = matchCount / search.length;
    return similarity >= 0.7;
  };
  
  const filtered = allUsers.filter(user => {
    const nameMatch = fuzzyMatch(user.name, term);
    const skillMatch = user.skills && user.skills.some(skill => fuzzyMatch(skill, term));
    return nameMatch || skillMatch;
  });
  
  // Show suggestions
  if (filtered.length === 0) {
    suggestionsContainer.innerHTML = '<div class="no-suggestions">No users found</div>';
    suggestionsContainer.classList.add('active');
  } else {
    suggestionsContainer.innerHTML = '';
    filtered.slice(0, 8).forEach(user => { // Show max 8 suggestions
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.onclick = () => {
        openProfileModal(user);
        suggestionsContainer.classList.remove('active');
        userSearchInput.value = '';
      };
      
      suggestionItem.innerHTML = `
        <img src="${user.avatar}" alt="${user.name}" class="suggestion-avatar">
        <div class="suggestion-info">
          <div class="suggestion-name">${user.name}</div>
          <div class="suggestion-skills">${user.skills ? user.skills.join(', ') : 'No skills listed'}</div>
        </div>
        <div class="suggestion-status ${user.isAvailable ? 'online' : 'offline'}"></div>
      `;
      
      suggestionsContainer.appendChild(suggestionItem);
    });
    suggestionsContainer.classList.add('active');
  }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  const searchBox = document.querySelector('.global-search-box');
  
  if (searchBox && !searchBox.contains(e.target)) {
    suggestionsContainer.classList.remove('active');
  }
});

// Self profile modal handlers
userMenu.addEventListener('click', () => {
  selfProfileModal.classList.add('active');
});

closeSelfProfileModal.addEventListener('click', () => {
  selfProfileModal.classList.remove('active');
});

closeSelfProfBtn.addEventListener('click', () => {
  selfProfileModal.classList.remove('active');
});

// Random video call
startRandomCallBtn.addEventListener('click', async () => {
  if (isSearchingMatch) return; // Prevent multiple clicks
  
  isSearchingMatch = true;
  videoModal.classList.add('active');
  motivationalQuote.textContent = getRandomQuote();
  videoInfo.classList.remove('hidden');
  remoteLabel.textContent = 'Joining queue...';
  
  try {
    // Join queue via socket
    socket.emit('queue:join');
    
  } catch (error) {
    console.error('Error joining queue:', error);
    videoModal.classList.remove('active');
    showNotification('Failed to join queue. Please try again.', 'error');
    isSearchingMatch = false;
  }
});

async function startVideoCall(user) {
  try {
    currentCallUser = user;
    remoteLabel.textContent = user.name;
    
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    localVideo.srcObject = localStream;
    motivationalQuote.textContent = `Connecting with ${user.name}...`;
    
    // Create peer connection
    peerConnection = new RTCPeerConnection(iceServersConfig);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
      videoInfo.classList.add('hidden'); // Hide quote when connected
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          toUserId: user.id,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        videoInfo.classList.add('hidden');
      } else if (peerConnection.connectionState === 'disconnected') {
        motivationalQuote.textContent = 'Connection lost...';
        videoInfo.classList.remove('hidden');
      } else if (peerConnection.connectionState === 'failed') {
        motivationalQuote.textContent = 'Connection failed. Please try again.';
        videoInfo.classList.remove('hidden');
        setTimeout(endVideoCall, 3000);
      }
    };
    
    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('call:initiate', {
      toUserId: user.id,
      offer: offer,
      fromUser: currentUser
    });
    
  } catch (error) {
    console.error('Error starting video call:', error);
    if (error.name === 'NotAllowedError') {
      showNotification('Camera/microphone access denied. Please allow permissions and try again.', 'error');
    } else if (error.name === 'NotFoundError') {
      showNotification('No camera or microphone found. Please connect a device.', 'error');
    } else {
      showNotification('Failed to start video call: ' + error.message, 'error');
    }
    endVideoCall();
  }
}

function cleanupCurrentCall() {
  // Stop local tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  // Notify other user
  if (currentCallUser) {
    socket.emit('call:end', { otherUserId: currentCallUser.id });
    currentCallUser = null;
  }
  
  // Clear video streams
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
}

function endVideoCall() {
  cleanupCurrentCall();
  
  // Close the modal
  videoModal.classList.remove('active');
}

// Video controls
toggleVideoBtn.addEventListener('click', () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      toggleVideoBtn.style.opacity = videoTrack.enabled ? '1' : '0.5';
      toggleVideoBtn.innerHTML = videoTrack.enabled ? 
        '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' :
        '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path><line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2"/></svg>';
    }
  }
});

toggleAudioBtn.addEventListener('click', () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      toggleAudioBtn.style.opacity = audioTrack.enabled ? '1' : '0.5';
      toggleAudioBtn.innerHTML = audioTrack.enabled ?
        '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>' :
        '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 9v6m0 0l-4-2m4 2l4-2M7 8v8m0 0l-4-2m4 2l4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2"/></svg>';
    }
  }
});

skipCallBtn.addEventListener('click', async () => {
  if (isSearchingMatch) return; // Prevent multiple clicks
  
  // Cleanup current connection
  cleanupCurrentCall();
  
  // Show searching state
  motivationalQuote.textContent = getRandomQuote();
  videoInfo.classList.remove('hidden');
  remoteLabel.textContent = 'Rejoining queue...';
  
  isSearchingMatch = true;
  
  // Rejoin queue
  try {
    socket.emit('queue:join');
  } catch (error) {
    console.error('Error rejoining queue:', error);
    showNotification('Failed to rejoin queue. Please try again.', 'error');
    isSearchingMatch = false;
  }
});

endCallBtn.addEventListener('click', endVideoCall);

// Socket events
socket.on('user:ping-received', (data) => {
  showNotification(`${data.from.name}: ${data.message}`, 'info');
});

socket.on('users:updated', () => {
  loadUsers();
});

socket.on('call:incoming', async (data) => {
  try {
    // Auto-accept incoming calls
    showNotification(`${data.from.name} is connecting to you...`, 'info');
    
    currentCallUser = data.from;
    remoteLabel.textContent = data.from.name;
    
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    localVideo.srcObject = localStream;
    videoModal.classList.add('active');
    motivationalQuote.textContent = `Connecting with ${data.from.name}...`;
    videoInfo.classList.remove('hidden');
      
      peerConnection = new RTCPeerConnection(iceServersConfig);
      
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
        videoInfo.classList.add('hidden');
      };
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            toUserId: data.callerId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          videoInfo.textContent = `Connected with ${data.from.name}`;
        } else if (peerConnection.connectionState === 'disconnected') {
          videoInfo.textContent = 'Connection lost...';
        } else if (peerConnection.connectionState === 'failed') {
          videoInfo.textContent = 'Connection failed. Please try again.';
          setTimeout(endVideoCall, 3000);
        }
      };
      
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('call:answer', {
        callerId: data.callerId,
        answer: answer
      });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    if (error.name === 'NotAllowedError') {
      showNotification('Camera/microphone access denied. Please allow permissions.', 'error');
    } else {
      showNotification('Failed to answer call: ' + error.message, 'error');
    }
    endVideoCall();
  }
});

socket.on('call:answered', async (data) => {
  try {
    await peerConnection.setRemoteDescription(data.answer);
  } catch (error) {
    console.error('Error setting remote description:', error);
  }
});

socket.on('call:declined', () => {
  showNotification('Call declined by the other user.', 'info');
  endVideoCall();
});

socket.on('call:ice-candidate', async (data) => {
  try {
    if (peerConnection) {
      await peerConnection.addIceCandidate(data.candidate);
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
});

socket.on('call:ended', () => {
  showNotification('Call ended. Searching for next person...', 'info');
  // Automatically search for next person
  skipCallBtn.click();
});

// Queue system socket events
socket.on('queue:joined', (data) => {
  remoteLabel.textContent = `In queue (Position: ${data.position})`;
  console.log(`Joined queue at position ${data.position}`);
});

socket.on('queue:matched', async (data) => {
  console.log('Matched with user:', data.match);
  remoteLabel.textContent = `Matched with ${data.match.name}! Connecting...`;
  currentCallUser = data.match;
  
  // Start video call with matched user
  await startVideoCall(data.match);
  isSearchingMatch = false;
});

socket.on('queue:left', () => {
  console.log('Left queue');
});

socket.on('queue:error', (data) => {
  console.error('Queue error:', data.message);
  showNotification(data.message, 'error');
  isSearchingMatch = false;
});

// Listen for user status changes
socket.on('user:status-change', ({ userId, isOnline }) => {
  loadUsers(); // Refresh user list to show updated status
});

// Listen for incoming pings
socket.on('ping:received', (ping) => {
  unreadPingsCount++;
  updatePingsBadge();
  
  // Show notification
  showNotification(`${ping.from.name} ${ping.message}`, 'info');
  
  // Reload pings if modal is open
  if (pingsModal.style.display === 'flex') {
    loadPings();
  }
});

// Listen for ping sent confirmation/error
socket.on('ping:sent', (response) => {
  if (response.success) {
    // Ping sent successfully
    showNotification('Ping sent successfully!', 'success');
  } else {
    // Show error to user
    showNotification(response.error, 'warning');
  }
});

// ============================================
// PING FUNCTIONS
// ============================================

async function sendPing(user) {
  try {
    socket.emit('user:ping', {
      toUserId: user.id,
      message: `wants to connect with you!`,
      fromUser: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    });
  } catch (error) {
    console.error('Error sending ping:', error);
    showNotification('Failed to send ping', 'error');
  }
}

async function loadPings() {
  try {
    const response = await fetch(`${API_URL}/api/ping/received`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    unreadPingsCount = data.unreadCount;
    updatePingsBadge();
    displayPings(data.pings);
  } catch (error) {
    console.error('Error loading pings:', error);
    pingsContainer.innerHTML = '<p class="no-pings">Failed to load notifications</p>';
  }
}

function displayPings(pings) {
  if (!pings || pings.length === 0) {
    pingsContainer.innerHTML = '<p class="no-pings">No notifications yet</p>';
    return;
  }
  
  pingsContainer.innerHTML = '';
  
  pings.forEach(ping => {
    const pingItem = document.createElement('div');
    pingItem.className = `ping-item ${!ping.isRead ? 'unread' : ''}`;
    pingItem.onclick = () => markPingAsRead(ping.id);
    
    const avatar = document.createElement('img');
    avatar.src = ping.sender.avatar;
    avatar.alt = ping.sender.name;
    avatar.className = 'ping-avatar';
    
    const pingInfo = document.createElement('div');
    pingInfo.className = 'ping-info';
    
    const senderName = document.createElement('h5');
    senderName.textContent = ping.sender.name;
    
    const message = document.createElement('p');
    message.textContent = ping.message;
    
    const timeAgo = document.createElement('span');
    timeAgo.className = 'ping-time';
    timeAgo.textContent = formatTimeAgo(new Date(ping.createdAt));
    
    pingInfo.appendChild(senderName);
    pingInfo.appendChild(message);
    
    pingItem.appendChild(avatar);
    pingItem.appendChild(pingInfo);
    pingItem.appendChild(timeAgo);
    
    pingsContainer.appendChild(pingItem);
  });
}

async function markPingAsRead(pingId) {
  try {
    await fetch(`${API_URL}/api/ping/${pingId}/read`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    loadPings();
  } catch (error) {
    console.error('Error marking ping as read:', error);
  }
}

async function markAllPingsRead() {
  try {
    await fetch(`${API_URL}/api/ping/mark-all-read`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    loadPings();
  } catch (error) {
    console.error('Error marking all pings as read:', error);
  }
}

function updatePingsBadge() {
  if (unreadPingsCount > 0) {
    pingsBadge.textContent = unreadPingsCount;
    pingsBadge.style.display = 'flex';
  } else {
    pingsBadge.style.display = 'none';
  }
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function showNotification(message, type = 'info') {
  // Custom toast notification with types
  const toast = document.createElement('div');
  toast.className = 'custom-notification';
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: white;
    color: #1a202c;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
    border-left: 4px solid ${colors[type]};
  `;
  
  const icon = document.createElement('span');
  icon.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${colors[type]};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
  `;
  icon.textContent = icons[type];
  
  const text = document.createElement('span');
  text.style.cssText = `
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
  `;
  text.textContent = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    border: none;
    background: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `;
  closeBtn.onclick = () => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  };
  
  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);
  
  // Dark mode support
  if (document.documentElement.classList.contains('dark-theme')) {
    toast.style.background = '#1f2937';
    toast.style.color = '#f3f4f6';
  }
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
  
  // Add to message box
  addMessageToBox(message, type);
}

// Message Box Functions
function addMessageToBox(message, type = 'info') {
  // Only store friend requests and ping notifications
  const allowedMessages = [
    'friend request',
    'ping',
    'wants to connect',
    'accepted',
    'rejected'
  ];
  
  const shouldStore = allowedMessages.some(keyword => message.toLowerCase().includes(keyword));
  
  if (!shouldStore) return; // Skip all other messages
  
  const messageObj = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date().toISOString(),
    category: 'system'
  };
  
  messagesStore.unshift(messageObj);
  
  // Keep only last 50 messages
  if (messagesStore.length > 50) {
    messagesStore = messagesStore.slice(0, 50);
  }
  
  localStorage.setItem('dashboardMessages', JSON.stringify(messagesStore));
  
  // Update badge count if message box is closed
  if (messageBoxModal.style.display !== 'flex') {
    updateMessageBadge();
  }
}

function updateMessageBadge() {
  const unreadCount = messagesStore.filter(m => !m.read).length;
  const badge = document.querySelector('#messageBoxBtn .notification-badge');
  if (!badge) {
    const newBadge = document.createElement('span');
    newBadge.className = 'notification-badge';
    newBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    newBadge.textContent = unreadCount;
    messageBoxBtn.appendChild(newBadge);
  } else {
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    badge.textContent = unreadCount;
  }
}

function loadMessages(filter = 'all') {
  const filteredMessages = filter === 'all' 
    ? messagesStore 
    : messagesStore.filter(m => m.category === filter);
  
  if (filteredMessages.length === 0) {
    messagesList.innerHTML = '<p class="no-messages">No messages yet</p>';
    return;
  }
  
  messagesList.innerHTML = filteredMessages.map(msg => {
    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[msg.type];
    
    const timeAgo = getTimeAgo(new Date(msg.timestamp));
    
    return `
      <div class="message-item" data-id="${msg.id}">
        <div class="message-icon ${msg.type}">
          ${icon}
        </div>
        <div class="message-content">
          <p class="message-text">${msg.message}</p>
          <span class="message-time">${timeAgo}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Mark all as read
  messagesStore.forEach(m => m.read = true);
  localStorage.setItem('dashboardMessages', JSON.stringify(messagesStore));
  updateMessageBadge();
}

// Message Box Event Listeners
messageBoxBtn.addEventListener('click', () => {
  messageBoxModal.style.display = 'flex';
  loadMessages('all');
});

closeMessageBoxModal.addEventListener('click', () => {
  messageBoxModal.style.display = 'none';
});

closeMessageBoxBtn.addEventListener('click', () => {
  messageBoxModal.style.display = 'none';
});

clearMessagesBtn.addEventListener('click', () => {
  if (confirm('Clear all messages?')) {
    messagesStore = [];
    localStorage.removeItem('dashboardMessages');
    loadMessages('all');
    updateMessageBadge();
  }
});

messageTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    messageTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadMessages(tab.dataset.tab);
  });
});

// Initialize message badge on page load
updateMessageBadge();

// Pings modal handlers
pingsNotifBtn.addEventListener('click', () => {
  pingsModal.style.display = 'flex';
  loadPings();
});

closePingsModal.addEventListener('click', () => {
  pingsModal.style.display = 'none';
});

closePingsBtn.addEventListener('click', () => {
  pingsModal.style.display = 'none';
});

markAllReadBtn.addEventListener('click', markAllPingsRead);

// Logout handler
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    // Clear JWT token
    localStorage.removeItem('authToken');
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/index.html';
  }
});

// ============================================
// FRIENDS FUNCTIONALITY
// ============================================

let selectedProfileUser = null;

async function loadFriends() {
  try {
    const response = await fetch(`${API_URL}/api/friends`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    displayFriends(data.friends);
    displayFriendRequests(data.pendingRequests);
  } catch (error) {
    console.error('Error loading friends:', error);
    friendsList.innerHTML = '<p class="no-pings">Failed to load friends</p>';
  }
}

function displayFriends(friends) {
  if (!friends || friends.length === 0) {
    friendsList.innerHTML = '<p class="no-pings">No friends yet. Add some!</p>';
    return;
  }
  
  friendsList.innerHTML = '';
  
  friends.forEach(friend => {
    const friendItem = document.createElement('div');
    friendItem.className = 'friend-item';
    friendItem.onclick = () => openProfileModal(friend);
    
    const friendInfo = document.createElement('div');
    friendInfo.className = 'friend-info';
    
    const avatarContainer = document.createElement('div');
    avatarContainer.style.position = 'relative';
    
    const avatar = document.createElement('img');
    avatar.src = friend.avatar;
    avatar.alt = friend.name;
    avatar.className = 'friend-avatar';
    
    const statusDot = document.createElement('div');
    statusDot.className = `status-indicator ${friend.isAvailable ? 'status-online' : 'status-offline'}`;
    
    avatarContainer.appendChild(avatar);
    avatarContainer.appendChild(statusDot);
    
    const name = document.createElement('span');
    name.className = 'friend-name';
    name.textContent = friend.name;
    
    friendInfo.appendChild(avatarContainer);
    friendInfo.appendChild(name);
    
    const actions = document.createElement('div');
    actions.className = 'friend-actions';
    
    if (friend.isAvailable && !friend.inCall) {
      const callBtn = document.createElement('button');
      callBtn.className = 'btn-primary btn-sm';
      callBtn.textContent = '📞';
      callBtn.onclick = (e) => {
        e.stopPropagation();
        initiateCall(friend);
      };
      actions.appendChild(callBtn);
    }
    
    const pingBtn = document.createElement('button');
    pingBtn.className = 'btn-secondary btn-sm';
    pingBtn.textContent = '📬';
    pingBtn.onclick = (e) => {
      e.stopPropagation();
      sendPing(friend);
    };
    actions.appendChild(pingBtn);
    
    friendItem.appendChild(friendInfo);
    friendItem.appendChild(actions);
    
    friendsList.appendChild(friendItem);
  });
}

function displayFriendRequests(requests) {
  if (!requests || requests.length === 0) {
    friendRequests.style.display = 'none';
    return;
  }
  
  friendRequests.style.display = 'block';
  friendRequestsList.innerHTML = '';
  
  requests.forEach(request => {
    const requestItem = document.createElement('div');
    requestItem.className = 'friend-request-item';
    
    const reqInfo = document.createElement('div');
    reqInfo.className = 'friend-info';
    
    const avatar = document.createElement('img');
    avatar.src = request.requester.avatar;
    avatar.alt = request.requester.name;
    avatar.className = 'friend-avatar';
    
    const name = document.createElement('span');
    name.textContent = request.requester.name;
    
    reqInfo.appendChild(avatar);
    reqInfo.appendChild(name);
    
    const actions = document.createElement('div');
    actions.className = 'friend-actions';
    
    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn-primary btn-sm';
    acceptBtn.textContent = '✓ Accept';
    acceptBtn.onclick = () => acceptFriendRequest(request.id);
    
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn-secondary btn-sm';
    rejectBtn.textContent = '✕';
    rejectBtn.onclick = () => rejectFriendRequest(request.id);
    
    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    
    requestItem.appendChild(reqInfo);
    requestItem.appendChild(actions);
    
    friendRequestsList.appendChild(requestItem);
  });
}

async function openProfileModal(user) {
  selectedProfileUser = user;
  
  document.getElementById('modalUserAvatar').src = user.avatar;
  document.getElementById('modalUserName').textContent = user.name;
  document.getElementById('modalUserEmail').textContent = user.email;
  
  const skillsContainer = document.getElementById('modalUserSkills');
  skillsContainer.innerHTML = '';
  if (user.skills && user.skills.length > 0) {
    user.skills.forEach(skill => {
      const skillTag = document.createElement('span');
      skillTag.className = 'user-skill-tag';
      skillTag.textContent = skill;
      skillsContainer.appendChild(skillTag);
    });
  }
  
  document.getElementById('modalUserBio').textContent = user.bio || 'No bio provided.';
  
  // Check friendship status
  try {
    const response = await fetch(`${API_URL}/api/friends/check/${user.id}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.status === 'accepted') {
      friendActionBtn.textContent = '✕ Remove Friend';
      friendActionBtn.className = 'btn-secondary';
      friendActionBtn.onclick = () => removeFriend(user.friendshipId || data.friendshipId);
    } else if (data.status === 'pending') {
      friendActionBtn.textContent = data.isSender ? 'Request Sent' : 'Accept Request';
      friendActionBtn.className = data.isSender ? 'btn-secondary' : 'btn-primary';
      friendActionBtn.disabled = data.isSender;
      if (!data.isSender) {
        friendActionBtn.onclick = () => acceptFriendRequest(data.friendshipId);
      }
    } else {
      friendActionBtn.textContent = '+ Add Friend';
      friendActionBtn.className = 'btn-primary';
      friendActionBtn.disabled = false;
      friendActionBtn.onclick = () => sendFriendRequest(user.id);
    }
  } catch (error) {
    console.error('Error checking friendship status:', error);
  }
  
  profileModal.style.display = 'flex';
}

async function sendFriendRequest(userId) {
  try {
    await fetch(`${API_URL}/api/friends/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ addresseeId: userId })
    });
    
    showNotification('Friend request sent!', 'success');
    profileModal.style.display = 'none';
    loadFriends();
  } catch (error) {
    console.error('Error sending friend request:', error);
    showNotification('Failed to send friend request', 'error');
  }
}

async function acceptFriendRequest(friendshipId) {
  try {
    await fetch(`${API_URL}/api/friends/${friendshipId}/accept`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    showNotification('Friend request accepted!', 'success');
    profileModal.style.display = 'none';
    loadFriends();
  } catch (error) {
    console.error('Error accepting friend request:', error);
    showNotification('Failed to accept request', 'error');
  }
}

async function rejectFriendRequest(friendshipId) {
  try {
    await fetch(`${API_URL}/api/friends/${friendshipId}/reject`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    showNotification('Friend request rejected', 'info');
    loadFriends();
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    showNotification('Failed to reject request', 'error');
  }
}

async function removeFriend(friendshipId) {
  if (!confirm('Remove this friend?')) return;
  
  try {
    await fetch(`${API_URL}/api/friends/${friendshipId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    showNotification('Friend removed');
    profileModal.style.display = 'none';
    loadFriends();
  } catch (error) {
    console.error('Error removing friend:', error);
    showNotification('Failed to remove friend');
  }
}

// Profile modal handlers
closeProfileModal.addEventListener('click', () => {
  profileModal.style.display = 'none';
});

closeProfModalBtn.addEventListener('click', () => {
  profileModal.style.display = 'none';
});

refreshFriendsBtn.addEventListener('click', loadFriends);

// Theme toggle
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Refresh users
refreshUsersBtn.addEventListener('click', loadUsers);

// Initialize on load
init();
