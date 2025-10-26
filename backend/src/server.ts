import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { scanMediaFolder, watchMediaFolder } from './services/scanner';
import { initDB } from './db';
import moviesRoutes from './routes/movies';
import peersRoutes from './routes/peers';
import { registerStreamRoutes } from './routes/stream';
import { startPeerDiscovery } from './services/discovery';
import { v4 as uuidv4 } from 'uuid';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

async function start() {
  const db = initDB();
  app.locals.db = db;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('frontend/dist'));

  app.use('/api', moviesRoutes);
  app.use('/api', peersRoutes);
  registerStreamRoutes(app);

  await scanMediaFolder(db);
  watchMediaFolder(db);

  startPeerDiscovery(db, io);

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('create-watch-party', async (data) => {
      const { movieId, hostPeerId } = data;
      const partyId = uuidv4();

      const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);

      db.prepare(
        `INSERT INTO watch_parties (id, hostPeerId, movieId, startTime, viewers)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`
      ).run(partyId, hostPeerId, movieId, JSON.stringify([hostPeerId]));

      socket.emit('party-created', { partyId });
      io.emit('party-available', { partyId, movieId, movieTitle: movie?.title || 'Unkown Movie', hostPeerId });
    });

    socket.on('join-watch-party', (data) => {
      const { partyId } = data;
      socket.join(`party-${partyId}`);
      io.to(`party-${partyId}`).emit('peer-joined', { peerId: socket.id });
    });

    socket.on('play', (data) => {
      const { partyId, timestamp } = data;
      io.to(`party-${partyId}`).emit('sync-play', { timestamp });
    });

    socket.on('pause', (data) => {
      const { partyId, timestamp } = data;
      io.to(`party-${partyId}`).emit('sync-pause', { timestamp });
    });

    socket.on('seek', (data) => {
      const { partyId, timestamp } = data;
      io.to(`party-${partyId}`).emit('sync-seek', { timestamp });
    });

    socket.on('disconnect', () => {
      console.log(`⚠️  Client disconnected: ${socket.id}`);
    });
  });

  const PORT = parseInt(process.env.PORT || '3000');
  httpServer.listen(PORT, () => {
    console.log(`CipherStream running on :${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, io };