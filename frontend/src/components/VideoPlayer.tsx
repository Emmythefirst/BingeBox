import { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface VideoPlayerProps {
    movieId: string;
    peerId?: string;
    partyId?: string;
    socket?: Socket;
}

export default function VideoPlayer({ movieId, peerId, partyId, socket }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    const videoUrl = peerId
    ? `http://localhost:3000/api/stream/${movieId}?peer=${peerId}`
    : `http://localhost:3000/api/stream/${movieId}`;

    useEffect(() => {
        if (!socket || !partyId) return;

        socket.on('sync-play', (data) => {
            if (videoRef.current) {
                videoRef.current.currentTime = data.timestamp
                videoRef.current.play()
                setIsPlaying(true)
            }
        })

        socket.on('sync-pause', (data) => {
            if (videoRef.current) {
                videoRef.current.currentTime = data.timestamp
                videoRef.current.pause()
                setIsPlaying(false)
            }
        })

        socket.on('sync-seek', (data) => {
            if (videoRef.current) {
                videoRef.current.currentTime = data.timestamp
            }
        })

        return () => {
            socket.off('sync-play')
            socket.off('sync-pause')
            socket.off('sync-seek')
        }
    }, [socket, partyId])

    const handlePlay = () => {
        setIsPlaying(true)
        if (socket && partyId) {
            socket.emit('play', {
                partyId,
                timestamp: videoRef.current?.currentTime || 0
            })
        }
    }

    const handlePause = () => {
        setIsPlaying(false)
        if (socket && partyId) {
            socket.emit('pause', {
                partyId,
                timestamp: videoRef.current?.currentTime || 0
            });
        }
    };

    const handleSeek = () => {
        if (socket && partyId) {
            socket.emit('seek', {
                partyId,
                timestamp: videoRef.current?.currentTime || 0
            })
        }
    }
    console.log("🎥 videoUrl:", videoUrl);

    return (
        <div className="player-container">
            <video
            ref={videoRef}
            src={videoUrl}
            className="video-player"
            controls={!partyId}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeek}
            />
            {partyId && (
                <div className="player-controls">
                    <button onClick={handlePlay} disabled={isPlaying}>Play</button>
                    <button onClick={handlePause} disabled={!isPlaying}>Pause</button>
                    <span style={{ marginLeft: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                        {isPlaying ? 'Playing' : 'Paused'}
                    </span>
                </div>
            )}
        </div>
    )
}