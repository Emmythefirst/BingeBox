import { useEffect, useState } from 'react';
import type { Peer } from '../types';
import { socket } from '../socket'; // same socket as app.tsx

export default function Peers() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.on('peer-discovered', (peer) => {
      setPeers(prev => {
        if (prev.find(p => p.id === peer.id)) return prev;
        return [...prev, peer];
      });
    });

    fetchPeers();

    return () => {
      socket.off('peer-dicovered')
    }
  }, []);

  const fetchPeers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/peers');
      const data = await res.json();
      setPeers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch peers:', error);
      setLoading(false);
    }

    if (loading) {
    return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Finding peers...</p>
        </div>
    );
  }
  };


  return (
    <div className="app-content">
      <h2 style={{ marginBottom: '2rem' }}>Nearby Peers</h2>
      
      {peers.length === 0 ? (
        <div className="empty-state">
          <p>No peers found on your network.</p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Make sure other Black Boxes are running CipherStream.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {peers.map(peer => (
            <div 
              key={peer.id}
              className="peer-card"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>📺 {peer.hostname}</h3>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                IP: {peer.ipAddress}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Port: {peer.port}
              </p>
              {peer.lastSeen && (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Last seen: {new Date(peer.lastSeen).toLocaleString()}
              </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}