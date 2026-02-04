import User from '../models/User.js';
import Ping from '../models/Ping.js';
import { Op } from 'sequelize';
import { 
  waitingQueue, 
  addToQueue, 
  removeFromQueue, 
  matchFromQueue 
} from '../routes/queue.js';
import { sendPingNotification } from '../utils/emailService.js';

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

        // Get receiver details for email
        const receiver = await User.findByPk(toUserId);
        const sender = await User.findByPk(socket.userId);

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
        
        // Send email notification (works even if user is offline)
        if (receiver && receiver.email && sender) {
          await sendPingNotification({
            to: receiver.email,
            receiverName: receiver.name,
            senderName: sender.name,
            message: ping.message
          });
          console.log(`📧 Email notification sent to ${receiver.email}`);
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

    // Queue system handlers
    socket.on('queue:join', async () => {
      try {
        const user = await User.findByPk(socket.userId);
        if (!user) return;

        const added = addToQueue(user);
        
        if (added) {
          console.log(`[Queue] User ${user.name} joined queue. Size: ${waitingQueue.size}`);
          
          socket.emit('queue:joined', {
            position: waitingQueue.size,
            queueSize: waitingQueue.size
          });

          // Try to find immediate match
          const match = matchFromQueue(user.id);
          
          if (match) {
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

            io.to(connectedUsers.get(match.userId)).emit('queue:matched', {
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

    socket.on('queue:leave', () => {
      try {
        const removed = removeFromQueue(socket.userId);
        if (removed) {
          console.log(`[Queue] User left queue. Size: ${waitingQueue.size}`);
          socket.emit('queue:left');
        }
      } catch (error) {
        console.error('[Queue] Error leaving queue:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        onlineUsers.delete(socket.userId);
        
        // Remove from queue if present
        const wasInQueue = removeFromQueue(socket.userId);
        if (wasInQueue) {
          console.log(`[Queue] User removed from queue on disconnect. Size: ${waitingQueue.size}`);
        }
        
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
