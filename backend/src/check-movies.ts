import { db } from './db';

const movies = db.prepare('SELECT id, title, filePath FROM movies').all();
console.table(movies);
