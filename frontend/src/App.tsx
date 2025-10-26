import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Catalog from './pages/Catalog';
import Peers from './pages/Peers';
import WatchPartyNotification from './components/WatchPartyNotification';
import './App.css';
import type { Movie, Peer } from './types';

const socket = io('http://localhost:3000')

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [peers, setPeers] = useState<Peer[]>([])
  const [isOffline, setIsOffline] = useState(false)
  const [currentPage, setCurrentPage] = useState('catalog')

  useEffect(() => {
    fetchMovies()
    fetchPeers()

    //Handle online/offline events
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    //Listen for peer discovery
    socket.on('peer-discovered', (peer) => {
      setPeers(prev => {
        //Avoid duplicates
        const exists = prev.find(p => p.id === peer.id)
        if (exists) return prev;
        return [...prev, peer]
      })
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      socket.off('peer-discovered')
    }
  }, [])

  const fetchMovies = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/movies')
      const data = await res.json()
      setMovies(data)
      setIsOffline(false)
    } catch (error) {
      console.error('Failed to fetch movies, trying offline cache:', error)
      //Fallback to offline cache
      try {
        const res = await fetch('http://localhost:3000/api/movies/offline')
        const data = await res.json();
        setMovies(data)
        setIsOffline(true)
      } catch {
        console.error('Offline cache unavailable')
      }
    }
  }

  const fetchPeers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/peers')
      const data = await res.json();
      setPeers(data);
    } catch (error) {
      console.error('Failed to fetch peers')
      setPeers([])
    }
  }

  return (
    <div className="app-container">
      <WatchPartyNotification socket={socket} />

      <nav className="app-nav">
        <h1>CipherStream</h1>
        <div className="app-nav-buttons">
          <button onClick={() => setCurrentPage('catalog')}>Catalog</button>
          <button onClick={() => setCurrentPage('peers')}>Peers ({peers.length})</button>
          {isOffline && (
            <span className="offline-indicator">Offline Mode</span>
          )}
        </div>
      </nav>

      <div className="app-content">
      {currentPage === 'catalog' && (
        <Catalog movies={movies} peers={peers} socket={socket} isOffline={isOffline} />
      )}

      {currentPage === 'peers' && <Peers />}
      </div>
    </div>
  )
}

export default App;