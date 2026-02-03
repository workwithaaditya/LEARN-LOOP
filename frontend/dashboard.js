// Dashboard JavaScript
const API_URL = 'http://localhost:5000';
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
  
  // Load users
  loadUsers();
  
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
    
    const userLeft = document.createElement('div');
    userLeft.className = 'user-item-left';
    
    const userImg = document.createElement('img');
    userImg.src = user.avatar;
    userImg.alt = user.name;
    
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
    
    userLeft.appendChild(userImg);
    userLeft.appendChild(userInfo);
    
    const pingBtn = document.createElement('button');
    pingBtn.className = 'btn-ping';
    pingBtn.textContent = user.inCall ? 'In Call' : 'Ping';
    pingBtn.disabled = user.inCall;
    pingBtn.onclick = () => pingUser(user);
    
    userItem.appendChild(userLeft);
    userItem.appendChild(pingBtn);
    
    usersList.appendChild(userItem);
  });
}

function pingUser(user) {
  socket.emit('user:ping', {
    toUserId: user._id,
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
          toUserId: user._id,
          candidate: event.candidate
        });
      }
    };
    
    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('call:initiate', {
      toUserId: user._id,
      offer: offer,
      fromUser: currentUser
    });
    
  } catch (error) {
    console.error('Error starting video call:', error);
    alert('Failed to access camera/microphone');
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
    socket.emit('call:end', { otherUserId: currentCallUser._id });
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
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  toggleVideoBtn.style.opacity = videoTrack.enabled ? '1' : '0.5';
});

toggleAudioBtn.addEventListener('click', () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  toggleAudioBtn.style.opacity = audioTrack.enabled ? '1' : '0.5';
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
  const accept = confirm(`${data.from.name} wants to video call you. Accept?`);
  
  if (accept) {
    currentCallUser = data.from;
    
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    localVideo.srcObject = localStream;
    videoModal.classList.add('active');
    videoInfo.textContent = `Connected with ${data.from.name}`;
    
    peerConnection = new RTCPeerConnection(config);
    
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          toUserId: data.callerId,
          candidate: event.candidate
        });
      }
    };
    
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('call:answer', {
      callerId: data.callerId,
      answer: answer
    });
  }
});

socket.on('call:answered', async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
});

socket.on('call:ice-candidate', async (data) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(data.candidate);
  }
});

socket.on('call:ended', () => {
  endVideoCall();
});

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
