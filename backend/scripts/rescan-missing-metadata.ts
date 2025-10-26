import dotenv from 'dotenv';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
// We'll import tmdb/offline modules dynamically after dotenv loads so they read the env variables correctly.

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const db = new BetterSqlite3(path.resolve(__dirname, '..', 'cipherstream.db'));

  // dynamic imports so they pick up env vars
  const { searchMovie, getMovieDetails, getTrailer } = await import('../src/services/tmdb');
  const { cacheMovieMetadata } = await import('../src/services/offline');

  const rows: any[] = db.prepare("SELECT * FROM movies WHERE tmdbId IS NULL OR tmdbId = ''").all();
  console.log(`Found ${rows.length} movies missing TMDb metadata`);

  for (const row of rows) {
    const title = row.title || row.filename;
    console.log(`Rescanning: ${title}`);

    const tmdbResult = await searchMovie(title);
    if (!tmdbResult) {
      console.log(`No TMDb match for ${title}`);
      continue;
    }

    const details = await getMovieDetails(tmdbResult.id);
    const trailer = await getTrailer(tmdbResult.id);

    db.prepare(
      `UPDATE movies SET tmdbId = ?, poster = ?, description = ?, duration = ?, trailer = ? WHERE id = ?`
    ).run(
      tmdbResult.id,
      tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
      tmdbResult.overview,
      (details && details.runtime) || 0,
      trailer,
      row.id
    );

    const movieMeta = {
      id: row.id,
      filename: row.filename,
      title: tmdbResult.title,
      description: tmdbResult.overview,
      poster: tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : null,
      duration: (details && details.runtime) || 0,
      trailer,
      tmdbId: tmdbResult.id,
    };

    await cacheMovieMetadata(db, movieMeta);
    console.log(`Updated metadata for ${title}`);
  }

  db.close();
}

run().catch((err) => {
  console.error('Rescan script failed:', err);
  process.exit(1);
});
