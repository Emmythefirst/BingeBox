import { db } from './db';

const movies = db.prepare('SELECT id, title, filename FROM movies').all();
console.table(movies);
