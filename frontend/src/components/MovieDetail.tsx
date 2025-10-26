import type { Movie, Peer } from '../types';
import { Socket } from 'socket.io-client';

interface MovieDetailProps {
    movie: Movie;
    peers: Peer[];
    socket: Socket;
    isOffline: boolean;
    onClose: () => void;
}

export default function MovieDetail({ movie, peers, socket, isOffline, onClose }: MovieDetailProps) {
    const handlePlayLocal = () => {
        window.location.href = `/watch/${movie.id}`
    }

    const handleStreamFromPeer = (peerId: string) => {
        window.location.href = `/watch/${movie.id}?peer=${peerId}`;
    }

    const handleStartWatchParty =() => {
        if (isOffline) {
            alert('Watch parties require internet connection')
            return;
        }
        socket.emit('create-watch-party', {
            movieId: movie.id,
            hostPeerId: 'local'
        });
        window.location.href = `/watch-party/${movie.id}`;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>x</button>

                <div className="movie-detail">
                    {movie.poster && (
                        <img
                        src={movie.poster}
                        alt={movie.title}
                        className="movie-poster"
                        />
                    )}

                    <div>
                        <h2>{movie.title}</h2>
                        <p className="movie-description">{movie.description}</p>
                        <p className="movie-duration">{movie.duration} min</p>

                        {movie.trailer && !isOffline && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <iframe
                                width="100%"
                                height="200"
                                src={movie.trailer}
                                style={{ borderRadius: '0.375rem' }}
                                allowFullScreen
                                />
                            </div>
                        )}

                        {isOffline && (
                            <div className="offline-banner">
                                Offline mode: Trailers and peer features unavailable.
                            </div>
                        )}

                        <div className="movie-actions">
                            <button
                            onClick={handlePlayLocal}
                            className="btn-primary">
                                Play Locally
                            </button>

                            <button
                            onClick={handleStartWatchParty}
                            disabled={isOffline}
                            className="btn-secondary"
                            style={{ opacity: isOffline ? 0.5 : 1 }}>
                                Start Watch Party
                            </button>

                            {!isOffline && peers.length > 0 && (
                                <div className="peers-list">
                                    <p>Available on Peers:</p>
                                    <div>
                                        {peers.map(peer => (
                                            <button
                                            key={peer.id}
                                            onClick={() => handleStreamFromPeer(peer.id)}
                                            className="peer-button">
                                                Stream from {peer.hostname}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isOffline && (
                                <div className="peers-list">
                                    <p>Available locally. Peer streaming requires internet.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}