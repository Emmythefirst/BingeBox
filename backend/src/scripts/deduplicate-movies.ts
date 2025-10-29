import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface Movie {
  id: string;
  filename: string;
  title: string;
  tmdbId: number;
  dateAdded: string;
}

// ✅ Dynamically resolve the DB path (portable & consistent)
const dbPath = path.resolve(__dirname, '../BingeBox.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found at', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

function deduplicateMovies() {
  console.log('🔍 Scanning for duplicate movies...\n');

  // Find filenames appearing more than once
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

  for (const dup of duplicates) {
    console.log(`📁 Processing: ${dup.filename} (${dup.count} copies)`);

    const movies = db.prepare(`
      SELECT * FROM movies
      WHERE filename = ?
      ORDER BY dateAdded ASC
    `).all(dup.filename) as Movie[];

    const keepMovie = movies[0];
    const duplicateIds = movies.slice(1).map((m) => m.id);

    console.log(`  ✅ Keeping: ${keepMovie.title || keepMovie.filename}`);
    console.log(`  🗑️ Removing ${duplicateIds.length} duplicate(s)\n`);

    // Update watch parties to point to the kept movie
    for (const dupId of duplicateIds) {
      db.prepare(`
        UPDATE watch_parties
        SET movieId = ?
        WHERE movieId = ?
      `).run(keepMovie.id, dupId);
    }

    // Update or remove offline cache entries
    for (const dupId of duplicateIds) {
      const existingCache = db
        .prepare('SELECT * FROM offline_cache WHERE movieId = ?')
        .get(keepMovie.id);

      if (existingCache) {
        db.prepare('DELETE FROM offline_cache WHERE movieId = ?').run(dupId);
      } else {
        db.prepare(`
          UPDATE offline_cache
          SET movieId = ?
          WHERE movieId = ?
        `).run(keepMovie.id, dupId);
      }
    }

    // Finally, delete duplicate movie entries
    for (const dupId of duplicateIds) {
      db.prepare('DELETE FROM movies WHERE id = ?').run(dupId);
      totalDeleted++;
    }
  }

  console.log(`\n✅ Deduplication complete!`);
  console.log(`   🧾 Removed ${totalDeleted} duplicate record(s).`);
  console.log(`   🎥 Watch party & offline cache data preserved.\n`);
}

// --- Execute the cleanup ---
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
