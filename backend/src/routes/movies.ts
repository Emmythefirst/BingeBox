import express from 'express';

   const router = express.Router();

   router.get('/movies', async (req, res) => {
     try {
       const db = req.app.locals.db;
       const movies = db.prepare('SELECT * FROM movies ORDER BY dateAdded DESC').all();
       res.json(movies);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch movies' });
     }
   });

   router.get('/movies/:id', async (req, res) => {
     try {
       const db = req.app.locals.db;
       const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
       if (!movie) return res.status(404).json({ error: 'Not found' });
       res.json(movie);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch movie' });
     }
    });

router.get('/movies/offline', async (req, res) => {
     try {
       const db = req.app.locals.db;
       const offlineMovies = db.prepare(
         `SELECT data FROM offline_cache ORDER BY cachedAt DESC`
       ).all();
       const movies = offlineMovies.map((row: any) => JSON.parse(row.data));
       res.json(movies);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch offline cache' });
     }
   });
 
export default router;