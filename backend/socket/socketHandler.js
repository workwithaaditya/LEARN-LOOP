import User from '../models/User.js';

const connectedUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // roomId -> [user1Id, user2Id]

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('user:join', async ({ userId }) => {
      try {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;

        // Update user's socket ID in database
        await User.update(
          { socketId: socket.id },
          { where: { id: userId } }
        );

        console.log(`👤 User ${userId} joined with socket ${socket.id}`);
        
        // Broadcast updated user list to all clients
        io.emit('users:updated');
      } catch (error) {
        console.error('Error in user:join:', error);
      }
    });

    // Send ping/message to another user
    socket.on('user:ping', ({ toUserId, message, fromUser }) => {
      const recipientSocketId = connectedUsers.get(toUserId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user:ping-received', {
          from: fromUser,
          message: message || 'wants to connect with you!',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Video call signaling
    socket.on('call:initiate', async ({ toUserId, offer, fromUser }) => {
      const recipientSocketId = connectedUsers.get(toUserId);
      
      if (recipientSocketId) {
        // Mark both users as in call
        await User.update({ inCall: true }, { where: { id: socket.userId } });
        await User.update({ inCall: true }, { where: { id: toUserId } });

        // Send call offer
        io.to(recipientSocketId).emit('call:incoming', {
          from: fromUser,
          offer,
          callerId: socket.userId
        });
      }
    });

    socket.on('call:answer', ({ callerId, answer }) => {
      const callerSocketId = connectedUsers.get(callerId);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:answered', { answer });
      }
    });

    socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
      const recipientSocketId = connectedUsers.get(toUserId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:ice-candidate', { candidate });
      }
    });

    socket.on('call:end', async ({ otherUserId }) => {
      // Mark both users as not in call
      if (socket.userId) {
        await User.update({ inCall: false }, { where: { id: socket.userId } });
      }
      if (otherUserId) {
        await User.update({ inCall: false }, { where: { id: otherUserId } });
        const otherSocketId = connectedUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('call:ended');
        }
      }

      io.emit('users:updated');
    });

    socket.on('call:skip', () => {
      // User wants to skip current call and find new match
      socket.emit('call:ended');
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Update user status in database
        await User.update(
          { socketId: null, inCall: false },
          { where: { id: socket.userId } }
        );

        io.emit('users:updated');
      }
    });
  });
};
