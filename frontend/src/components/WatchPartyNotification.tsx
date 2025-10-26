import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface WatchPartyNotificationProps {
  socket: Socket;
}

export default function WatchPartyNotification({ socket }: WatchPartyNotificationProps) {
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    socket.on('party-available', (data) => {
      // Show notification when someone starts a watch party
      setInvitation(data);
    });
  }, [socket]);

  const handleJoin = () => {
    socket.emit('join-watch-party', { partyId: invitation.partyId });
    window.location.href = `/watch-party/${invitation.partyId}`;
  };

  const handleIgnore = () => {
    setInvitation(null);
  };

  if (!invitation) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: '#1a1a1a',
      border: '2px solid #3b82f6',
      borderRadius: '0.5rem',
      padding: '1rem',
      zIndex: 1000
    }}>
      <p style={{ marginBottom: '0.5rem' }}>
        🎉 <strong>{invitation.hostPeerId}</strong> started a watch party!
      </p>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
        Movie: {invitation.movieTitle}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleJoin} className="btn-primary">
          Join Party
        </button>
        <button onClick={handleIgnore} style={{ backgroundColor: '#6b7280' }}>
          Ignore
        </button>
      </div>
    </div>
  );
}