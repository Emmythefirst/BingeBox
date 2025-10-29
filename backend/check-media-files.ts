import path from 'path';
import fs from 'fs';
import { db } from './src/db';

const mediaDir = path.resolve(__dirname, 'media'); // path to your media folder
const movies = db.prepare('SELECT id, filename FROM movies').all();

console.log(`🎬 Checking ${movies.length} movies...\n`);

for (const movie of movies) {
  const filePath = path.join(mediaDir, movie.filename);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${movie.filename}`);
  } else {
    console.log(`❌ Missing: ${movie.filename}`);
  }
}
