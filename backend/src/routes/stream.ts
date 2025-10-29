import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { db } from '../db';
import fetch from 'node-fetch'; // make sure you installed this: npm i node-fetch

export function registerStreamRoutes(app: any) {
  app.get('/api/stream/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { peer } = req.query;

    // ✅ 1. If a peer is provided, proxy stream from that peer
    if (peer) {
      const peerData = db.prepare('SELECT * FROM peers WHERE id = ?').get(peer);
      if (!peerData) return res.status(404).send('Peer not found');

      const peerIp = peerData.ipAddress;
      const peerPort = peerData.port;
      const peerMovieUrl = `http://${peerIp}:${peerPort}/api/stream/${id}`;

      console.log('🔄 Proxying stream from peer:', peerMovieUrl);

      try {
        const response = await fetch(peerMovieUrl, {
          headers: {
            range: req.headers.range || '',
          },
        });

        // copy status & headers from peer response
        res.status(response.status);
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // pipe the video chunks directly to this client
        response.body?.pipe(res);
        return;
      } catch (err) {
        console.error('❌ Peer stream failed:', err);
        return res.status(500).send('Failed to stream from peer');
      }
    }

    // ✅ 2. Local file streaming fallback
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    const filePath = path.resolve(__dirname, '../../media', movie.filename);
    console.log('🎬 Trying to stream file:', filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    file.pipe(res);
  });
}
