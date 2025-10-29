import { useEffect, useState } from 'react';
import { socket } from '../socket';

interface Party {
  partyId: string;
  movieTitle: string;
  hostPeerId: string;
}

interface PeerListProps {
  peers: string[];
}

export default function PeerList({ peers }: PeerListProps) {
  const [parties, setParties] = useState<Party[]>([]);

  useEffect(() => {
    // Log socket connection
    socket.on('connect', () => {
      console.log('✅ Connected to socket server:', socket.id);
    });

    // Listen for new watch parties
    socket.on('party-available', (data: Party) => {
      console.log('📡 New party available:', data);
      setParties((prev) => {
        const exists = prev.find((p) => p.partyId === data.partyId);
        return exists ? prev : [...prev, data];
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('party-available');
    };
  }, []);

  return (
    <div className="peer-list" style={{ padding: '1rem' }}>
      <h2>Available Watch Parties</h2>

      {parties.length === 0 ? (
        <p>No active parties yet.</p>
      ) : (
        <ul style={{ marginTop: '1rem' }}>
          {parties.map((party) => (
            <li key={party.partyId} style={{ marginBottom: '0.5rem' }}>
              🎥 <strong>{party.movieTitle}</strong> (host: {party.hostPeerId})
            </li>
          ))}
        </ul>
      )}

      {peers.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem' }}>Connected Peers</h3>
          <ul>
            {peers.map((peer) => (
              <li key={peer}>{peer}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
