export async function cacheMovieMetadata(db: any, movie: any) {
     try {
       const cacheData = {
         id: movie.id,
         title: movie.title,
         description: movie.description,
         poster: movie.poster,
         duration: movie.duration,
         trailer: movie.trailer,
         tmdbId: movie.tmdbId,
         filename: movie.filename
       };

       db.prepare(
         `INSERT OR REPLACE INTO offline_cache (movieId, data, cachedAt)
          VALUES (?, ?, CURRENT_TIMESTAMP)`
       ).run(movie.id, JSON.stringify(cacheData));

       console.log(`✓ Cached metadata: ${movie.title}`);
     } catch (error) {
       console.error('Cache failed:', error);
     }
   }

   export async function getOfflineMovies(db: any) {
     try {
       const cached = db.prepare(
         `SELECT data FROM offline_cache ORDER BY cachedAt DESC`
       ).all();
       return cached.map((row: any) => JSON.parse(row.data));
     } catch (error) {
       console.error('Failed to retrieve offline cache:', error);
       return [];
     }
   }

   export async function clearStaleCache(db: any, days = 7) {
     try {
       db.prepare(
         `DELETE FROM offline_cache WHERE cachedAt < datetime('now', '-${days} days')`
       ).run();
       console.log('✓ Cleared stale cache');
     } catch (error) {
       console.error('Cache clear failed:', error);
     }
   }
