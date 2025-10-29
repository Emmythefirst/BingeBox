import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';



export function initDB() {
  const dbPath = process.env.DB_PATH || './data/BingeBox.db';
  const resolvedPath = path.resolve(dbPath);
  const dbDir = path.dirname(resolvedPath);

   if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ Created database directory: ${dbDir}`);
   }

   console.log(`📁 Database path: ${resolvedPath}`);
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

// Movies table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      title TEXT,
      tmdbId INTEGER,
      poster TEXT,
      description TEXT,
      duration INTEGER,
      trailer TEXT,
      dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  // Watch Parties table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS watch_parties (
      id TEXT PRIMARY KEY,
      hostPeerId TEXT NOT NULL,
      movieId TEXT NOT NULL,
      startTime DATETIME,
      endTime DATETIME,
      viewers TEXT,
      FOREIGN KEY(movieId) REFERENCES movies(id)
    );
  `).run()

  // Peers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS peers (
      id TEXT PRIMARY KEY,
      hostname TEXT,
      ipAddress TEXT,
      port INTEGER DEFAULT 3001,
      lastSeen DATETIME,
      reputation INTEGER DEFAULT 5
    );
    `).run();

    // Offline Cache table
    db.prepare(`
    CREATE TABLE IF NOT EXISTS offline_cache (
      movieId TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(movieId) REFERENCES movies(id)
    );
  `).run();

  console.log('✅ Database initialized successfully');
  return db as any;
}

export const db = initDB();
