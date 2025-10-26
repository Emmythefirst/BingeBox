import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import VideoPlayer from '../components/VideoPlayer';
import PeerList from '../components/PeerList';

interface WatchPartyProps {
    socket: Socket;
    partyId: string;
    movieId: string;
}

export default function WatchParty({ socket, partyId, movieId }: WatchPartyProps) {
    const [peers, setPeers] = useState<string[]>([])

    useEffect(() => {
        socket.on('peer-joined', (data) => {
            setPeers(prev => [...new Set([...prev, data.peerId])])
        })
    }, [socket])

    return (
        <div className="app-content">
            <h2>Watch Party</h2>
            <VideoPlayer movieId={movieId} partyId={partyId} socket={socket} />
            <PeerList peers={peers} />
        </div>
    )
}