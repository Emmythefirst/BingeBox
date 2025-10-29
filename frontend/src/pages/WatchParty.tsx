import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import VideoPlayer from '../components/VideoPlayer';
import PeerList from '../components/PeerList';

export default function WatchParty() {
  const { id: partyId } = useParams<{ id: string }>();
  const [peers, setPeers] = useState<string[]>([]);
  const [movieId, setMovieId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partyId) {
      setError('No party ID provided');
      setLoading(false);
      return;
    }

    // ✅ FIX: Correct URL with full backend address
    fetch(`http://localhost:3000/api/watch-parties/${partyId}`)
      .then(res => {
        if (!res.ok) throw new Error('Party not found');
        return res.json();
      })
      .then(data => {
        console.log('✅ Watch party data:', data);
        setMovieId(data.movieId);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Failed to fetch party info:', err);
        setError('Failed to load watch party.');
        setLoading(false);
      });

    const onConnect = () => {
      console.log('✅ Connected with socket ID:', socket.id);
      if (socket.id) setPeers([socket.id]);
      socket.emit('join-watch-party', { partyId });
    };

    const onPeerJoined = (data: { peerId: string }) => {
      console.log('👥 Peer joined:', data.peerId);
      setPeers(prev => [...new Set([...prev, data.peerId])]);
    };

    const onConnectError = (err: any) => {
      console.error('❌ Socket connect error:', err);
      setError('Failed to connect to server.');
    };

    socket.on('connect', onConnect);
    socket.on('peer-joined', onPeerJoined);
    socket.on('connect_error', onConnectError);

    // If already connected, join immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('peer-joined', onPeerJoined);
      socket.off('connect_error', onConnectError);
    };
  }, [partyId]);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading watch party...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ padding: '2rem' }}>
        <div className="empty-state">
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button onClick={() => window.location.href = '/'} style={{ marginTop: '1rem' }}>
            ← Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  if (!partyId || !movieId) {
    return (
      <div className="app-container" style={{ padding: '2rem' }}>
        <div className="empty-state">
          <p>Invalid party.</p>
          <button onClick={() => window.location.href = '/'}>← Back to Catalog</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <button 
          onClick={() => window.location.href = '/'}
          style={{ marginBottom: '1rem', backgroundColor: 'transparent', border: '1px solid #374151' }}
        >
          ← Leave Party
        </button>

        <h2 style={{ marginBottom: '2rem' }}>🎉 Watch Party</h2>
        
        <VideoPlayer movieId={movieId} partyId={partyId} socket={socket} />
        
        <PeerList peers={peers} />
      </div>
    </div>
  );
}