import User from '../models/User.js';
import Ping from '../models/Ping.js';
import { Op } from 'sequelize';

const connectedUsers = new Map(); // userId -> socketId
const onlineUsers = new Set(); // Set of online userIds
const activeCalls = new Map(); // roomId -> [user1Id, user2Id]

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('user:join', async ({ userId }) => {
      try {
        connectedUsers.set(userId, socket.id);
        onlineUsers.add(userId);
        socket.userId = userId;

        // Update user's online status in database
        await User.update(
          { socketId: socket.id, isAvailable: true },
          { where: { id: userId } }
        );

        console.log(`👤 User ${userId} joined and is now online`);
        
        // Broadcast user came online
        io.emit('user:status-change', { userId, isOnline: true });
        io.emit('users:updated');
      } catch (error) {
        console.error('Error in user:join:', error);
      }
    });

    // Send ping/message to another user
    socket.on('user:ping', async ({ toUserId, message, fromUser }) => {
      try {
        // Check if user already sent a ping to this person today
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingPing = await Ping.findOne({
          where: {
            senderId: socket.userId,
            receiverId: toUserId,
            createdAt: {
              [Op.gte]: twentyFourHoursAgo
            }
          },
          order: [['createdAt', 'DESC']]
        });

        // If ping was sent less than 24 hours ago, reject
        if (existingPing) {
          const hoursRemaining = Math.ceil((existingPing.createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
          socket.emit('ping:sent', { 
            success: false, 
            error: `You can ping this user again in ${hoursRemaining} hour(s)` 
          });
          return;
        }

        // Save ping to database
        const ping = await Ping.create({
          senderId: socket.userId,
          receiverId: toUserId,
          message: message || 'wants to connect with you!'
        });

        const recipientSocketId = connectedUsers.get(toUserId);
        
        // If user is online, send real-time notification
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('ping:received', {
            id: ping.id,
            from: fromUser,
            message: ping.message,
            timestamp: ping.createdAt,
            isRead: false
          });
        }
        
        // Confirm to sender
        socket.emit('ping:sent', { success: true, toUserId });
      } catch (error) {
        console.error('Error sending ping:', error);
        socket.emit('ping:sent', { success: false, error: error.message });
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

    socket.on('call:declined', async ({ callerId }) => {
      const callerSocketId = connectedUsers.get(callerId);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:declined');
      }
      
      // Mark caller as not in call
      await User.update({ inCall: false }, { where: { id: callerId } });
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
        onlineUsers.delete(socket.userId);
        
        // Update user status in database - mark as offline
        await User.update(
          { socketId: null, isAvailable: false, inCall: false },
          { where: { id: socket.userId } }
        );

        // Broadcast user went offline
        io.emit('user:status-change', { userId: socket.userId, isOnline: false });
        io.emit('users:updated');
      }
    });
  });

  // Export helper functions and expose onlineUsers Set
  io.isUserOnline = (userId) => onlineUsers.has(userId);
  io.getOnlineUsersCount = () => onlineUsers.size;
  io.onlineUsers = onlineUsers; // Expose the Set for match filtering
};
