import dotenv from 'dotenv';
import path from 'path';
import { db } from '../db';

// ✅ Load environment variables early
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  console.log('🔍 Starting metadata rescan...');

  // Dynamic imports (so they see .env variables correctly)
  const { searchMovie, getMovieDetails, getTrailer } = await import('../services/tmdb');
  const { cacheMovieMetadata } = await import('../services/offline');

  const rows = db.prepare(`
    SELECT * FROM movies
    WHERE tmdbId IS NULL OR tmdbId = ''
  `).all();

  if (rows.length === 0) {
    console.log('✅ All movies already have metadata.');
    db.close();
    return;
  }

  console.log(`🧾 Found ${rows.length} movie(s) missing TMDb metadata.\n`);

  for (const row of rows) {
    const title = row.title || row.filename;
    console.log(`🎬 Rescanning: ${title}`);

    try {
      const tmdbResult = await searchMovie(title);
      if (!tmdbResult) {
        console.log(`⚠️ No TMDb match found for "${title}"`);
        continue;
      }

      const details = await getMovieDetails(tmdbResult.id);
      const trailer = await getTrailer(tmdbResult.id);

      db.prepare(`
        UPDATE movies
        SET tmdbId = ?, poster = ?, description = ?, duration = ?, trailer = ?
        WHERE id = ?
      `).run(
        tmdbResult.id,
        tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
        tmdbResult.overview,
        details?.runtime || 0,
        trailer,
        row.id
      );

      const movieMeta = {
        id: row.id,
        filename: row.filename,
        title: tmdbResult.title,
        description: tmdbResult.overview,
        poster: tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
        duration: details?.runtime || 0,
        trailer,
        tmdbId: tmdbResult.id,
      };

      await cacheMovieMetadata(db, movieMeta);
      console.log(`✅ Updated metadata for "${title}"\n`);
    } catch (err) {
      console.error(`❌ Failed to rescan "${title}":`, err);
    }
  }

  db.close();
  console.log('\n✨ Metadata rescan completed.');
}

run().catch((err) => {
  console.error('❌ Rescan script failed:', err);
  process.exit(1);
});
