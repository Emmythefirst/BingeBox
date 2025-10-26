import { useState } from 'react';
import MovieCard from '../components/MovieCard';
import MovieDetail from '../components/MovieDetail';
import type { Movie, Peer } from '../types';
import { Socket } from 'socket.io-client';

interface CatalogProps {
    movies: Movie[];
    peers: Peer[];
    socket: Socket;
    isOffline: boolean;
}

export default function Catalog({ movies, peers, socket, isOffline }: CatalogProps) {
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    return (
        <div className="app-content">
            <div className="catalog-header">
                <h2>Your Library</h2>
                {isOffline && (
                    <div className="offline-banner">
                        Offline Mode - Browsing cached metadata. Watch parties unavailable.
                        </div>
                )}
            </div>

            {selectedMovie && (
                <MovieDetail
                movie={selectedMovie}
                peers={peers}
                socket={socket}
                isOffline={isOffline}
                onClose={() => setSelectedMovie(null)}
                />
            )}

            {movies.length === 0 ? (
                <div className="empty-state">
                    <p>No movies found. {isOffline ? 'No cached data available.' : 'Scan your /media folder.'}</p>
                </div>
            ) : (
                <div className="movie-grind">
                    {movies.map(movie => (
                        <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => setSelectedMovie(movie)}
                        />
                   ))}
                </div>
            )}
        </div>
    )
}
