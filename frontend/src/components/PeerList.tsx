import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function PeerList() {
  const [parties, setParties] = useState<any[]>([]);

  useEffect(() => {
    // Confirm connection
    socket.on('connect', () => {
      console.log('✅ Connected to socket server:', socket.id);
    });

    // Listen for new available parties from the backend
    socket.on('party-available', (data) => {
      console.log('📡 New party available:', data);
      setParties((prev) => {
        // Prevent duplicates
        const exists = prev.find((p) => p.partyId === data.partyId);
        return exists ? prev : [...prev, data];
      });
    });

    return () => {
      socket.off('connect');
      socket.off('party-available');
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Available Watch Parties</h2>
      {parties.length === 0 ? (
        <p>No active parties yet.</p>
      ) : (
        <ul>
          {parties.map((party) => (
            <li key={party.partyId}>
              🎥 <strong>{party.movieTitle}</strong> (host: {party.hostPeerId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
