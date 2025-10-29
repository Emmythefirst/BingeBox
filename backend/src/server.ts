import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { scanMediaFolder, watchMediaFolder } from './services/scanner';
import { initDB } from './db';
import moviesRoutes from './routes/movies';
import peersRoutes from './routes/peers';
import { registerStreamRoutes } from './routes/stream';
import { startPeerDiscovery } from './services/discovery';
import watchPartiesRouter from './routes/watchParties';

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Keep both for fallback compatibility
});

async function start() {
  const db = initDB();
  app.locals.db = db;

  app.use(
    cors({
      origin: FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'frontend/dist')));

  // ✅ API routes
  app.use('/api', moviesRoutes);
  app.use('/api', peersRoutes);
  app.use('/api/watch-parties', watchPartiesRouter);
  registerStreamRoutes(app);

  // ✅ Start media scanner & peer discovery
  await scanMediaFolder(db);
  watchMediaFolder(db);
  startPeerDiscovery(db, io);

  // ================= SOCKET.IO EVENTS =================
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // --- CREATE WATCH PARTY ---
    socket.on('create-watch-party', (data) => {
      try {
        console.log('🟡 Received create-watch-party event:', data);
        const hostPeerId = data?.hostPeerId || socket.id;
        const { movieId } = data || {};

        if (!movieId) {
          socket.emit('party-error', { message: 'Missing movie ID.' });
          return;
        }

        if (!hostPeerId) {
          socket.emit('party-error', { message: 'Missing host ID.' });
          return;
        }

        // Verify movie exists
        const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
        if (!movie) {
          socket.emit('party-error', { message: 'Movie not found in database.' });
          return;
        }

        const partyId = uuidv4();

        db.prepare(
          `INSERT INTO watch_parties (id, hostPeerId, movieId, startTime, viewers)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`
        ).run(partyId, hostPeerId, movieId, JSON.stringify([hostPeerId]));

        // Respond only to the creator
        socket.emit('party-created', { partyId });

        // Notify others
        socket.broadcast.emit('party-available', {
          partyId,
          movieId,
          movieTitle: movie.title,
          hostPeerId,
        });

        console.log(`🎬 Watch party created for "${movie.title}" by ${hostPeerId}`);
      } catch (err) {
        console.error('create-watch-party failed:', err);
        socket.emit('party-error', { message: 'Failed to create watch party.' });
      }
    });

    // --- JOIN WATCH PARTY ---
    socket.on('join-watch-party', (data) => {
      const { partyId } = data;
      if (!partyId) return;

      console.log(`👥 ${socket.id} joined party ${partyId}`);
      socket.join(`party-${partyId}`);

      io.to(`party-${partyId}`).emit('peer-joined', { peerId: socket.id });
    });

    // --- PLAYBACK SYNC EVENTS ---
    socket.on('play', ({ partyId, timestamp }) => {
      io.to(`party-${partyId}`).emit('sync-play', { timestamp });
    });

    socket.on('pause', ({ partyId, timestamp }) => {
      io.to(`party-${partyId}`).emit('sync-pause', { timestamp });
    });

    socket.on('seek', ({ partyId, timestamp }) => {
      io.to(`party-${partyId}`).emit('sync-seek', { timestamp });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`⚠️ Client disconnected: ${socket.id}`);
    });
  });

  //  Start backend
  const PORT = parseInt(process.env.PORT || '3000');
  httpServer.listen(PORT, () => {
    console.log(`🚀 BingeBox backend running on http://localhost:${PORT}`);
    console.log(`🔌 Allowed frontend origin: ${FRONTEND_URL}`);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

export { app, io };
