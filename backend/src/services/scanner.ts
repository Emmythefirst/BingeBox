import fs from 'fs';
import path from 'path';
import { searchMovie, getMovieDetails, getTrailer } from './tmdb';
import { v4 as uuidv4 } from 'uuid';
import { cacheMovieMetadata } from './offline';

const MEDIA_PATH = process.env.MEDIA_PATH || './media';
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv'];

export async function scanMediaFolder(db: any) {
  try {
    if (!fs.existsSync(MEDIA_PATH)) {
      console.log(`Media path not found: ${MEDIA_PATH}`)
      return;
    }
    const files = fs.readdirSync(MEDIA_PATH);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) continue;

      const title = path.basename(file, ext).replace(/[._-]/g, ' ').trim();

      // Check if already in DB
      const existing = db.prepare('SELECT id FROM movies WHERE filename = ?').get(file);
      if (existing) {
        console.log(`Skipping ${file} (already in database)`)
        continue;
      }

      // Search TMDb
      const tmdbResult = await searchMovie(title);
      if (!tmdbResult) {
        // Fallback: store without metadata
        const id = uuidv4();
        db.prepare('INSERT INTO movies (id, filename, title) VALUES (?, ?, ?)').run(id, file, title);
        // cache minimal metadata
        await cacheMovieMetadata(db, { id, filename: file, title });
        continue;
      }

      // Get full details + trailer
      const details = await getMovieDetails(tmdbResult.id);
      const trailer = await getTrailer(tmdbResult.id);

      const id = uuidv4();
      db.prepare(
        `INSERT INTO movies (id, filename, title, tmdbId, poster, description, duration, trailer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        file,
        tmdbResult.title,
        tmdbResult.id,
        tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
        tmdbResult.overview,
        (details && details.runtime) || 0,
        trailer
      );

      // cache metadata for offline use
      await cacheMovieMetadata(db, {
        id,
        filename: file,
        title: tmdbResult.title,
        description: tmdbResult.overview,
        poster: tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
        duration: (details && details.runtime) || 0,
        trailer,
        tmdbId: tmdbResult.id,
      });

      console.log(`✓ Added: ${tmdbResult.title}`);
    }
  } catch (error) {
    console.error('Scan failed:', error);
  }
}

export function watchMediaFolder(db: any) {
  if (!fs.existsSync(MEDIA_PATH)) return null;
  const watcher = fs.watch(MEDIA_PATH, () => {
    console.log('Media folder changed, rescanning...');
    scanMediaFolder(db);
  });
  return watcher;
}