import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'cipherstream.db');
const db = new Database(dbPath);

interface Movie {
  id: string;
  filename: string;
  title: string;
  tmdbId: number;
  dateAdded: string;
}

function deduplicateMovies() {
  console.log('🔍 Finding duplicate movies...\n');

  // Find all movies grouped by filename
  const duplicates = db.prepare(`
    SELECT filename, COUNT(*) as count
    FROM movies
    GROUP BY filename
    HAVING count > 1
  `).all() as { filename: string; count: number }[];

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate filename(s):\n`);

  let totalDeleted = 0;

  // Process each duplicate
  for (const dup of duplicates) {
    console.log(`📁 Processing: ${dup.filename} (${dup.count} copies)`);

    // Get all movie records with this filename
    const movies = db.prepare(`
      SELECT * FROM movies 
      WHERE filename = ? 
      ORDER BY dateAdded ASC
    `).all(dup.filename) as Movie[];

    // Keep the oldest one (first added)
    const keepMovie = movies[0];
    const duplicateIds = movies.slice(1).map(m => m.id);

    console.log(`  ✓ Keeping: ${keepMovie.id} (added ${keepMovie.dateAdded})`);
    console.log(`  ✗ Removing: ${duplicateIds.length} duplicate(s)\n`);

    // Relink watch_parties
    for (const dupId of duplicateIds) {
      db.prepare(`
        UPDATE watch_parties 
        SET movieId = ? 
        WHERE movieId = ?
      `).run(keepMovie.id, dupId);
    }

    // Relink offline_cache
    for (const dupId of duplicateIds) {
      // Check if keepMovie already has cache entry
      const existingCache = db.prepare(
        'SELECT * FROM offline_cache WHERE movieId = ?'
      ).get(keepMovie.id);

      if (existingCache) {
        // If keepMovie already cached, just delete duplicate cache
        db.prepare('DELETE FROM offline_cache WHERE movieId = ?').run(dupId);
      } else {
        // Otherwise, update duplicate cache to point to keepMovie
        db.prepare(`
          UPDATE offline_cache 
          SET movieId = ? 
          WHERE movieId = ?
        `).run(keepMovie.id, dupId);
      }
    }

    // Delete duplicate movie records
    for (const dupId of duplicateIds) {
      db.prepare('DELETE FROM movies WHERE id = ?').run(dupId);
      totalDeleted++;
    }
  }

  console.log(`\n✅ Deduplication complete!`);
  console.log(`   Removed ${totalDeleted} duplicate movie record(s)`);
  console.log(`   Watch party and offline cache history preserved`);
}

// Run the deduplication
try {
  db.prepare('BEGIN TRANSACTION').run();
  deduplicateMovies();
  db.prepare('COMMIT').run();
} catch (error) {
  db.prepare('ROLLBACK').run();
  console.error('❌ Error during deduplication:', error);
} finally {
  db.close();
}