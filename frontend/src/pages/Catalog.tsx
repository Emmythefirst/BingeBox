import { useState } from 'react';
import MovieCard from '../components/MovieCard';
import MovieDetail from '../components/MovieDetail';
import type { Movie, Peer } from '../types';

interface CatalogProps {
  movies: Movie[];
  peers: Peer[];
  isOffline: boolean;
}

export default function Catalog({ movies, peers, isOffline }: CatalogProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <section className="catalog-container">
      <header className="catalog-header">
        <h2>Your Library</h2>
        {isOffline && (
          <div className="offline-banner">
            Offline Mode — Browsing cached metadata. Watch parties unavailable.
          </div>
        )}
      </header>

      {selectedMovie && (
        <div className="modal-overlay">
          <div className="modal-content">
            <MovieDetail
              movie={selectedMovie}
              peers={peers}
              isOffline={isOffline}
              onClose={() => setSelectedMovie(null)}
            />
          </div>
        </div>
      )}

      {movies.length === 0 ? (
        <div className="empty-state">
          <p>
            No movies found.{' '}
            {isOffline ? 'No cached data available.' : 'Scan your /media folder.'}
          </p>
        </div>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => setSelectedMovie(movie)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
