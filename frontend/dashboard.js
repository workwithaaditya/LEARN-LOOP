// Dashboard JavaScript
const API_URL = 'https://learn-loop-production.up.railway.app'; // Replace with actual Railway URL
const socket = io(API_URL, { withCredentials: true });

let currentUser = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCallUser = null;

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// DOM Elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const skillsList = document.getElementById('skillsList');
const usersList = document.getElementById('usersList');
const availabilityToggle = document.getElementById('availabilityToggle');
const editSkillsBtn = document.getElementById('editSkillsBtn');
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

// Profile Modal elements
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const closeProfModalBtn = document.getElementById('closeProfModalBtn');
const friendActionBtn = document.getElementById('friendActionBtn');

// Friends elements
const friendsList = document.getElementById('friendsList');
const friendRequests = document.getElementById('friendRequests');
const friendRequestsList = document.getElementById('friendRequestsList');
const refreshFriendsBtn = document.getElementById('refreshFriendsBtn');

// Modal elements
const skillsModal = document.getElementById('skillsModal');
const videoModal = document.getElementById('videoModal');
const closeSkillsModal = document.getElementById('closeSkillsModal');
const cancelSkillsBtn = document.getElementById('cancelSkillsBtn');
const saveSkillsBtn = document.getElementById('saveSkillsBtn');
const skillsInput = document.getElementById('skillsInput');

// Video elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const videoInfo = document.getElementById('videoInfo');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const skipCallBtn = document.getElementById('skipCallBtn');
const endCallBtn = document.getElementById('endCallBtn');

let unreadPingsCount = 0;

// Initialize
async function init() {
  // Check authentication
  const authCheck = await fetch(`${API_URL}/auth/current-user`, {
    credentials: 'include'
  });
  
  const authData = await authCheck.json();
  
  if (!authData.authenticated) {
    window.location.href = '/index.html';
    return;
  }
  
  currentUser = authData.user;
  displayUserInfo();
  
  // Join socket room
  socket.emit('user:join', { userId: currentUser.id });
  
  // Load users, friends, and pings
  loadUsers();
  loadFriends();
  loadPings();
  
  // Setup theme
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
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
    currentUser.skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      skillsList.appendChild(tag);
    });
  } else {
    skillsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.875rem;">No skills added yet</p>';
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
      displayUsers(data.users);
    } else {
      usersList.innerHTML = '<p class="no-users">No users available right now</p>';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = '<p class="no-users">Failed to load users</p>';
  }
}

function displayUsers(users) {
  usersList.innerHTML = '';
  
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
    
    // Show different button based on online status
    const actionBtn = document.createElement('button');
    if (user.isAvailable && !user.inCall) {
      actionBtn.className = 'btn-primary btn-sm';
      actionBtn.textContent = '📞 Call';
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        initiateCall(user);
      };
    } else {
      actionBtn.className = 'btn-secondary btn-sm';
      actionBtn.textContent = '📬 Ping';
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        sendPing(user);
      };
    }
    
    userItem.appendChild(userLeft);
    userItem.appendChild(actionBtn);
    
    usersList.appendChild(userItem);
  });
}

function pingUser(user) {
  socket.emit('user:ping', {
    toUserId: user.id,
    message: `${currentUser.name} wants to connect with you!`,
    fromUser: currentUser
  });
  
  alert(`Ping sent to ${user.name}!`);
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

// Skills modal
editSkillsBtn.addEventListener('click', () => {
  skillsInput.value = currentUser.skills.join(', ');
  skillsModal.classList.add('active');
});

closeSkillsModal.addEventListener('click', () => {
  skillsModal.classList.remove('active');
});

cancelSkillsBtn.addEventListener('click', () => {
  skillsModal.classList.remove('active');
});

saveSkillsBtn.addEventListener('click', async () => {
  const skills = skillsInput.value.split(',').map(s => s.trim()).filter(s => s);
  
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ skills })
    });
    
    const data = await response.json();
    currentUser.skills = data.user.skills;
    displaySkills();
    skillsModal.classList.remove('active');
  } catch (error) {
    console.error('Error saving skills:', error);
  }
});

// Random video call
startRandomCallBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_URL}/api/match/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preferredSkills: currentUser.skills })
    });
    
    const data = await response.json();
    
    if (data.match) {
      currentCallUser = data.match;
      await startVideoCall(data.match);
    } else {
      alert('No users available for matching right now. Try again later!');
    }
  } catch (error) {
    console.error('Error finding match:', error);
    alert('Failed to find a match. Please try again.');
  }
});

async function startVideoCall(user) {
  try {
    currentCallUser = user;
    
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    localVideo.srcObject = localStream;
    videoModal.classList.add('active');
    videoInfo.textContent = `Connecting with ${user.name}...`;
    
    // Create peer connection
    peerConnection = new RTCPeerConnection(config);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
      videoInfo.textContent = `Connected with ${user.name}`;
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
        videoInfo.textContent = `Connected with ${user.name}`;
      } else if (peerConnection.connectionState === 'disconnected') {
        videoInfo.textContent = 'Connection lost...';
      } else if (peerConnection.connectionState === 'failed') {
        videoInfo.textContent = 'Connection failed. Please try again.';
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
      alert('Camera/microphone access denied. Please allow permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      alert('No camera or microphone found. Please connect a device.');
    } else {
      alert('Failed to start video call: ' + error.message);
    }
    endVideoCall();
  }
}

function endVideoCall() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  if (currentCallUser) {
    socket.emit('call:end', { otherUserId: currentCallUser.id });
  }
  
  localStream = null;
  peerConnection = null;
  currentCallUser = null;
  
  videoModal.classList.remove('active');
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
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

skipCallBtn.addEventListener('click', () => {
  endVideoCall();
  startRandomCallBtn.click(); // Find new match
});

endCallBtn.addEventListener('click', endVideoCall);

// Socket events
socket.on('user:ping-received', (data) => {
  alert(`${data.from.name}: ${data.message}`);
});

socket.on('users:updated', () => {
  loadUsers();
});

socket.on('call:incoming', async (data) => {
  try {
    const accept = confirm(`${data.from.name} wants to video call you. Accept?`);
    
    if (accept) {
      currentCallUser = data.from;
      
      localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localVideo.srcObject = localStream;
      videoModal.classList.add('active');
      videoInfo.textContent = `Connecting with ${data.from.name}...`;
      
      peerConnection = new RTCPeerConnection(config);
      
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
        videoInfo.textContent = `Connected with ${data.from.name}`;
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
    } else {
      // User declined the call
      socket.emit('call:declined', { callerId: data.callerId });
    }
  } catch (error) {
    console.error('Error handling incoming call:', error);
    if (error.name === 'NotAllowedError') {
      alert('Camera/microphone access denied. Please allow permissions.');
    } else {
      alert('Failed to answer call: ' + error.message);
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
  alert('Call declined by the other user.');
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
  endVideoCall();
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
  showNotification(`${ping.from.name} ${ping.message}`);
  
  // Reload pings if modal is open
  if (pingsModal.style.display === 'flex') {
    loadPings();
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
    
    showNotification(`Ping sent to ${user.name}!`);
  } catch (error) {
    console.error('Error sending ping:', error);
    showNotification('Failed to send ping');
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

function showNotification(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--color-primary);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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
      credentials: 'include'
    });
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
    
    showNotification('Friend request sent!');
    profileModal.style.display = 'none';
    loadFriends();
  } catch (error) {
    console.error('Error sending friend request:', error);
    showNotification('Failed to send friend request');
  }
}

async function acceptFriendRequest(friendshipId) {
  try {
    await fetch(`${API_URL}/api/friends/${friendshipId}/accept`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    showNotification('Friend request accepted!');
    profileModal.style.display = 'none';
    loadFriends();
  } catch (error) {
    console.error('Error accepting friend request:', error);
    showNotification('Failed to accept request');
  }
}

async function rejectFriendRequest(friendshipId) {
  try {
    await fetch(`${API_URL}/api/friends/${friendshipId}/reject`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    showNotification('Friend request rejected');
    loadFriends();
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    showNotification('Failed to reject request');
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
