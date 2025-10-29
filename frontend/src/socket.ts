import { io, Socket } from 'socket.io-client';

// ✅ Use your backend URL (change if hosted)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ✅ Create a single global socket instance
export const socket: Socket = io(API_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
});

// ✅ Helpful logging for dev
socket.on('connect', () => {
  console.log(`✅ Socket connected:, ${socket.id}`);
});

socket.on('disconnect', (reason) => {
  console.warn(`⚠️ Disconnected: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.error(`❌ Connection error: ${err.message}`);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 Reconnection attempt ${attempt}`);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Failed to reconnect after multiple attempts.');
});

