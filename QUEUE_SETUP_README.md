# Queue System Setup Documentation

## Overview
This document explains how to activate the queue-based video chat matching system. The infrastructure is ready but **currently disabled** to prevent issues.

## Files Created
1. `backend/routes/queue.js` - Queue API endpoints
2. `backend/socket/queueHandlers.js` - Queue socket events
3. This README file

## Current Status: DISABLED ❌

The queue system is set up but NOT connected to prevent website freezing issues that occurred during initial implementation.

## How Queue System Works

### Backend Components

#### 1. Waiting Queue Map
```javascript
const waitingQueue = new Map();
// Key: userId
// Value: { userId, name, skills, joinedAt }
```

#### 2. API Endpoints (in queue.js)
- `POST /api/queue/join-queue` - Add user to queue
- `POST /api/queue/leave-queue` - Remove user from queue
- `GET /api/queue/check-queue` - Get queue status
- `POST /api/queue/find-match` - Match users (FIFO)

#### 3. Socket Events (in queueHandlers.js)
- `queue:join` - User joins queue
- `queue:leave` - User leaves queue
- `queue:status` - Get current status
- `queue:joined` - Emitted when user added to queue
- `queue:matched` - Emitted when match found
- `queue:left` - Emitted when user removed
- `queue:error` - Emitted on errors

### Matching Algorithm
**FIFO (First In, First Out)**
- Users matched based on `joinedAt` timestamp
- Oldest user in queue gets matched first
- Fair matching for all users

## How to Activate (When Ready)

### Step 1: Enable Backend Routes

In `backend/server.js`, add:

```javascript
// Import queue router
const { router: queueRouter } = require('./routes/queue');

// Register routes (add after other routes)
app.use('/api/queue', queueRouter);
```

### Step 2: Enable Socket Handlers

In `backend/socket/socketHandler.js`, add:

```javascript
// Import queue handlers
const { setupQueueHandlers } = require('./queueHandlers');

// Inside setupSocketHandlers function, add:
setupQueueHandlers(io, socket, user);
```

### Step 3: Update Frontend (dashboard.js)

Replace current matching logic with queue system:

```javascript
// In startRandomCallBtn click handler:
startRandomCallBtn.addEventListener('click', async () => {
  try {
    // Join queue instead of direct match
    socket.emit('queue:join');
    
    videoModal.classList.add('active');
    videoInfo.classList.remove('hidden');
    remoteLabel.textContent = 'Joining queue...';
    
  } catch (error) {
    showNotification('Failed to join queue', 'error');
  }
});

// Add queue event listeners:
socket.on('queue:joined', (data) => {
  remoteLabel.textContent = `In queue (Position: ${data.position})`;
});

socket.on('queue:matched', async (data) => {
  currentCallUser = data.match;
  await startVideoCall(data.match);
});

socket.on('queue:error', (data) => {
  showNotification(data.message, 'error');
});
```

### Step 4: Remove Old Matching Logic

Comment out or remove:
- `/api/match/find` API calls
- Auto-retry setTimeout loops
- Direct match finding logic

## Why Queue System?

### Problems with Current System:
- Users manually retry every 5 seconds
- No fair matching (random selection)
- "No users available" spam
- Inefficient polling

### Benefits of Queue System:
- ✅ Fair FIFO matching
- ✅ Automatic matching (no manual retry)
- ✅ Real-time notifications via sockets
- ✅ No notification spam
- ✅ Better user experience
- ✅ More efficient (event-driven)

## Testing Checklist (When Activating)

- [ ] Backend queue routes respond correctly
- [ ] Socket events fire properly
- [ ] Users can join/leave queue
- [ ] Matching works (FIFO order)
- [ ] Both users notified on match
- [ ] Queue cleaned up on disconnect
- [ ] No memory leaks (Map properly cleaned)
- [ ] Frontend updates queue position
- [ ] Video call starts after match
- [ ] Skip button works with queue
- [ ] Multiple users can queue simultaneously
- [ ] Website doesn't freeze
- [ ] Socket connections stable

## Rollback Plan

If issues occur after activation:

1. Comment out queue routes in `server.js`
2. Comment out queue handlers in `socketHandler.js`
3. Restore old matching logic in `dashboard.js`
4. Restart backend server

## Notes

- Queue persists only in memory (Map)
- Queue cleared on server restart
- Disconnect handler removes users from queue
- Position updates in real-time
- No timeout for queue waiting (stays until matched)

## Future Enhancements

- Add queue timeout (remove after X minutes)
- Skill-based matching within queue
- Premium users priority in queue
- Queue analytics and metrics
- Persistent queue (database-backed)
- Queue position animations on frontend

---

**Last Updated:** [Current Date]
**Status:** Infrastructure ready, activation pending
**Reason for Delay:** Previous implementation caused website freeze
