import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import type { Movie } from '../types';

export default function Player() {
    const { movieId } = useParams(); // ✅ move this OUTSIDE the useEffect
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [peerId, setPeerId] = useState<string | null>(null);

    useEffect(() => {
        console.log("🎬 movieId from params:", movieId);

        if (!movieId) {
            setError('No movie ID provided');
            setLoading(false);
            return;
        }

        // Check if streaming from peer
        const urlParams = new URLSearchParams(window.location.search);
        const peerIdFromUrl = urlParams.get('peer');
        setPeerId(peerIdFromUrl);

        // Fetch movie details
        fetchMovie(movieId);
    }, [movieId]); // ✅ add movieId as dependency

    const fetchMovie = async (movieId: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/movies/${movieId}`);

            if (!res.ok) {
                throw new Error('Movie not found');
            }

            const data = await res.json();
            setMovie(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch movie:', err);
            setError('Failed to load movie');
            setLoading(false);
        }
    };

    const handleBack = () => {
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading movie...</p>
                </div>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="app-container">
                <div className="empty-state">
                    <p>{error || 'Movie not found'}</p>
                    <button onClick={handleBack} style={{ marginTop: '1rem' }}>
                        Back to Catalog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="app-content">
                <button
                    onClick={handleBack}
                    style={{
                        marginBottom: '1rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #374151',
                    }}
                >
                    Back to Catalog
                </button>

                <div style={{ marginBottom: '1rem' }}>
                    <h2>{movie.title}</h2>
                    {peerId && (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            Streaming from peer: {peerId.substring(0, 8)}...
                        </p>
                    )}
                </div>

                <VideoPlayer movieId={movie.id} peerId={peerId || undefined} />

                {movie.description && (
                    <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>About</h3>
                        <p className="movie-description">{movie.description}</p>
                        {movie.duration && (
                            <p className="movie-duration">
                                Duration: {movie.duration} minutes
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
