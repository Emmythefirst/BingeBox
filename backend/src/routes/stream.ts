// routes/stream.ts
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { db } from '../db';

export function registerStreamRoutes(app: any) {
  app.get('/api/stream/:id', (req: Request, res: Response) => {
    const { movieId } = req.params;
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);

    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    const filePath = path.resolve(movie.filePath); // this should be a valid absolute path
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
