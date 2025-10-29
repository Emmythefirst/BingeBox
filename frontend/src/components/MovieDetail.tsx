import { useState } from 'react';
import type { Movie, Peer } from '../types';
import { socket } from '../socket';

interface MovieDetailProps {
  movie: Movie;
  peers: Peer[];
  isOffline: boolean;
  onClose: () => void;
}

export default function MovieDetail({ movie, peers, isOffline, onClose }: MovieDetailProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayLocal = () => {
    window.location.href = `/watch/${movie.id}`;
  };

  const handleStreamFromPeer = (peerId: string) => {
    window.location.href = `/watch/${movie.id}?peer=${peerId}`;
  };

  const handleStartWatchParty = () => {
    if (isOffline) {
      alert('⚠️ Watch parties require internet connection.');
      return;
    }

    if (!socket.connected) {
      setError('Socket disconnected. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`🎬 Creating watch party for "${movie.title}"`);

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Server took too long to respond.');
    }, 8000);

    // Listen for response
    socket.once('party-created', ({ partyId }: { partyId: string }) => {
      clearTimeout(timeoutId);
      console.log('✅ Watch party created:', partyId);
      setLoading(false);
      window.location.href = `/watch-party/${partyId}`;
    });

    socket.once('party-error', ({ message }: { message: string }) => {
      clearTimeout(timeoutId);
      setLoading(false);
      setError(message || 'Failed to create watch party.');
    });

    // Emit event
    socket.emit('create-watch-party', {
      movieId: movie.id,
      title: movie.title,
      hostPeerId: socket.id,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="movie-detail">
          {movie.poster && (
            <img src={movie.poster} alt={movie.title} className="movie-poster" />
          )}

          <div>
            <h2>{movie.title}</h2>
            <p className="movie-description">{movie.description}</p>
            <p className="movie-duration">⏱️ {movie.duration} min</p>

            {error && (
              <div style={{ 
                color: '#ef4444', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                ⚠️ {error}
              </div>
            )}

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
                📡 Offline mode: trailers and peer features unavailable.
              </div>
            )}

            <div className="movie-actions">
              <button onClick={handlePlayLocal} className="btn-primary">
                ▶️ Play Locally
              </button>

              <button
                onClick={handleStartWatchParty}
                disabled={isOffline || loading}
                className="btn-secondary"
                style={{ opacity: isOffline || loading ? 0.5 : 1 }}
              >
                {loading ? '⏳ Creating Party...' : '🎉 Start Watch Party'}
              </button>

              {!isOffline && peers.length > 0 && (
                <div className="peers-list">
                  <p>Available on Peers:</p>
                  <div>
                    {peers.map((peer) => (
                      <button
                        key={peer.id}
                        onClick={() => handleStreamFromPeer(peer.id)}
                        className="peer-button"
                      >
                        📺 Stream from {peer.hostname || peer.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isOffline && (
                <div className="peers-list">
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    ✓ Available locally. Peer streaming requires internet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}