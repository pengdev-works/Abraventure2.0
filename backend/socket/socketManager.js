import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforabraventure2026';

let io = null;

// userId (UUID string) → Set of socket IDs
const userSockets = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connections for public events (announcements etc.)
      socket.userId = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.municipalityId = decoded.municipality_id;
      next();
    } catch {
      socket.userId = null;
      next(); // Don't reject — just treat as unauthenticated
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
      }
      userSockets.get(socket.userId).add(socket.id);

      // Join role-based rooms
      socket.join(`role:${socket.userRole}`);
      if (socket.municipalityId) {
        socket.join(`municipality:${socket.municipalityId}`);
      }

      console.log(`[SOCKET] User ${socket.userId} (${socket.userRole}) connected — socket ${socket.id}`);
    }

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  console.log('[SOCKET] Socket.IO server initialised');
  return io;
};

export const getIO = () => io;

/** Emit an event to a specific user (all their tabs/devices) */
export const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  const sockets = userSockets.get(String(userId));
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
};

/** Emit an event to all users in a role room */
export const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

/** Emit an event to all users in a municipality room */
export const emitToMunicipality = (municipalityId, event, data) => {
  if (!io) return;
  io.to(`municipality:${municipalityId}`).emit(event, data);
};

/** Broadcast an event to every connected socket */
export const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};
