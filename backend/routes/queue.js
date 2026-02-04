// Queue system infrastructure - NOW ACTIVE
// FIFO (First In, First Out) matching system

import express from 'express';
const router = express.Router();

// Waiting queue Map structure
// Key: userId, Value: { userId, name, skills, joinedAt }
const waitingQueue = new Map();

// Helper function to add user to queue
function addToQueue(user) {
  if (!waitingQueue.has(user.id)) {
    waitingQueue.set(user.id, {
      userId: user.id,
      name: user.name,
      skills: user.skills,
      joinedAt: Date.now()
    });
    return true;
  }
  return false;
}

// Helper function to remove user from queue
function removeFromQueue(userId) {
  return waitingQueue.delete(userId);
}

// Helper function to find match (FIFO)
function matchFromQueue(currentUserId) {
  // Get all users in queue except current user
  const availableUsers = Array.from(waitingQueue.values())
    .filter(user => user.userId !== currentUserId);
  
  if (availableUsers.length === 0) {
    return null;
  }
  
  // Sort by joinedAt (oldest first - FIFO)
  availableUsers.sort((a, b) => a.joinedAt - b.joinedAt);
  
  // Return oldest user
  return availableUsers[0];
}

// Get queue status
function getQueueStatus() {
  return {
    queueSize: waitingQueue.size,
    users: Array.from(waitingQueue.values())
  };
}

// JOIN QUEUE - Add user to waiting queue
router.post('/join-queue', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user;
    const added = addToQueue(user);

    if (added) {
      console.log(`User ${user.name} joined queue. Queue size: ${waitingQueue.size}`);
      
      // Emit socket event to notify user
      const io = req.app.get('io');
      io.to(`user_${user.id}`).emit('queue:joined', {
        position: waitingQueue.size
      });

      res.json({ 
        success: true, 
        position: waitingQueue.size,
        message: 'Added to queue'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Already in queue' 
      });
    }
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

// LEAVE QUEUE - Remove user from waiting queue
router.post('/leave-queue', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const removed = removeFromQueue(userId);

    if (removed) {
      console.log(`User ${req.user.name} left queue. Queue size: ${waitingQueue.size}`);
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`user_${userId}`).emit('queue:left');

      res.json({ 
        success: true, 
        message: 'Removed from queue'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Not in queue' 
      });
    }
  } catch (error) {
    console.error('Error leaving queue:', error);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
});

// CHECK QUEUE - Get current queue status
router.get('/check-queue', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = getQueueStatus();
    const userInQueue = waitingQueue.has(req.user.id);

    res.json({
      ...status,
      userInQueue
    });
  } catch (error) {
    console.error('Error checking queue:', error);
    res.status(500).json({ error: 'Failed to check queue' });
  }
});

// FIND MATCH - Process queue and match users (FIFO)
router.post('/find-match', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUserId = req.user.id;
    const match = matchFromQueue(currentUserId);

    if (match) {
      // Remove both users from queue
      removeFromQueue(currentUserId);
      removeFromQueue(match.userId);

      console.log(`Matched ${req.user.name} with ${match.name}`);

      // Emit socket events to both users
      const io = req.app.get('io');
      
      // Notify current user
      io.to(`user_${currentUserId}`).emit('queue:matched', {
        match: {
          id: match.userId,
          name: match.name,
          skills: match.skills
        }
      });

      // Notify matched user
      io.to(`user_${match.userId}`).emit('queue:matched', {
        match: {
          id: req.user.id,
          name: req.user.name,
          skills: req.user.skills
        }
      });

      res.json({
        success: true,
        match: {
          id: match.userId,
          name: match.name,
          skills: match.skills
        }
      });
    } else {
      // No match found, keep user in queue
      addToQueue(req.user);
      
      res.json({
        success: false,
        message: 'No match found, waiting in queue',
        position: waitingQueue.size
      });
    }
  } catch (error) {
    console.error('Error finding match:', error);
    res.status(500).json({ error: 'Failed to find match' });
  }
});

// Export router and queue utilities
export { 
  router,
  waitingQueue,
  addToQueue,
  removeFromQueue,
  matchFromQueue,
  getQueueStatus
};
