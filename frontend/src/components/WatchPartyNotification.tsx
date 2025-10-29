import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface WatchPartyInvitation {
  partyId: string;
  hostPeerId: string;
  movieTitle: string;
}

interface WatchPartyNotificationProps {
  socket: Socket;
}

export default function WatchPartyNotification({ socket }: WatchPartyNotificationProps) {
  const [invitation, setInvitation] = useState<WatchPartyInvitation | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | null>(null);

  useEffect(() => {
    // Capture local socket id when connected
    const onConnect = () => {
      if (socket.id) {
        console.log('🧩 Connected socket.id:', socket.id);
        setLocalPeerId(socket.id);
      }
    };

    socket.on('connect', onConnect);

    // Main handler for incoming watch party invites
    const handlePartyAvailable = (data: WatchPartyInvitation) => {
      const currentId = socket.id; // always up-to-date
      console.log('👀 INVITE RECEIVED:', data);
      console.log('🧠 localPeerId:', localPeerId);
      console.log('🎯 socket.id:', socket.id);


      // ✅ Ignore invites coming from ourselves
      if (data.hostPeerId === currentId) {
        console.log('🪄 Ignored own party invitation');
        return;
      }

      setInvitation(data);
      console.log('🎉 Incoming watch party invitation:', data);
    };

    socket.on('party-available', handlePartyAvailable);

    return () => {
      socket.off('connect', onConnect);
      socket.off('party-available', handlePartyAvailable);
    };
  }, [socket]); // no need for localPeerId dependency

  void localPeerId

  const handleJoin = () => {
    if (!invitation) return;
    socket.emit('join-watch-party', { partyId: invitation.partyId });
    alert(`✅ Joined ${invitation.movieTitle} party! (Navigation coming soon)`);
    setInvitation(null);
  };

  const handleIgnore = () => setInvitation(null);

  if (!invitation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        backgroundColor: '#1a1a1a',
        border: '2px solid #3b82f6',
        borderRadius: '0.5rem',
        padding: '1rem',
        zIndex: 1000,
        width: '300px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
        🎉 {invitation.hostPeerId.substring(0, 6)}... started a watch party!
      </p>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
        Movie: {invitation.movieTitle}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleJoin} className="btn-primary" style={{ flex: 1 }}>
          Join Party
        </button>
        <button
          onClick={handleIgnore}
          style={{
            flex: 1,
            backgroundColor: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
          }}
        >
          Ignore
        </button>
      </div>
    </div>
  );
}
