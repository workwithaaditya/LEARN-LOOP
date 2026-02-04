// Queue-related socket handlers - NOT ACTIVE YET
// This file sets up queue socket events but doesn't implement them
// To activate: import and use in socketHandler.js

const { 
  waitingQueue, 
  addToQueue, 
  removeFromQueue, 
  matchFromQueue 
} = require('../routes/queue');

// Setup queue-related socket events
function setupQueueHandlers(io, socket, user) {
  
  // User joins video chat queue
  socket.on('queue:join', () => {
    try {
      const added = addToQueue(user);
      
      if (added) {
        console.log(`[Queue] User ${user.name} joined queue. Size: ${waitingQueue.size}`);
        
        // Notify user they joined
        socket.emit('queue:joined', {
          position: waitingQueue.size,
          queueSize: waitingQueue.size
        });

        // Try to find immediate match
        const match = matchFromQueue(user.id);
        
        if (match) {
          // Match found, remove both from queue
          removeFromQueue(user.id);
          removeFromQueue(match.userId);

          console.log(`[Queue] Matched ${user.name} with ${match.name}`);

          // Notify both users
          socket.emit('queue:matched', {
            match: {
              id: match.userId,
              name: match.name,
              skills: match.skills
            }
          });

          io.to(`user_${match.userId}`).emit('queue:matched', {
            match: {
              id: user.id,
              name: user.name,
              skills: user.skills
            }
          });
        }
      } else {
        socket.emit('queue:error', { message: 'Already in queue' });
      }
    } catch (error) {
      console.error('[Queue] Error joining queue:', error);
      socket.emit('queue:error', { message: 'Failed to join queue' });
    }
  });

  // User leaves video chat queue
  socket.on('queue:leave', () => {
    try {
      const removed = removeFromQueue(user.id);
      
      if (removed) {
        console.log(`[Queue] User ${user.name} left queue. Size: ${waitingQueue.size}`);
        socket.emit('queue:left');
      }
    } catch (error) {
      console.error('[Queue] Error leaving queue:', error);
    }
  });

  // User requests queue status
  socket.on('queue:status', () => {
    try {
      socket.emit('queue:status', {
        position: waitingQueue.has(user.id) ? 
          Array.from(waitingQueue.keys()).indexOf(user.id) + 1 : null,
        queueSize: waitingQueue.size,
        inQueue: waitingQueue.has(user.id)
      });
    } catch (error) {
      console.error('[Queue] Error getting queue status:', error);
    }
  });

  // Cleanup: Remove user from queue on disconnect
  socket.on('disconnect', () => {
    const wasInQueue = removeFromQueue(user.id);
    if (wasInQueue) {
      console.log(`[Queue] User ${user.name} disconnected and removed from queue. Size: ${waitingQueue.size}`);
    }
  });
}

module.exports = { setupQueueHandlers };
