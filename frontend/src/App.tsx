import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { socket } from './socket';
import Catalog from './pages/Catalog';
import Peers from './pages/Peers';
import Player from './pages/Player';
import WatchParty from './pages/WatchParty';
import WatchPartyNotification from './components/WatchPartyNotification';
import './App.css';
import type { Movie, Peer } from './types';

function AppContent() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Better route detection
  const getCurrentPage = () => {
    if (location.pathname === '/peers') return 'peers';
    if (location.pathname === '/') return 'catalog';
    return 'none'; // On watch/watch-party pages
  };

  const currentPage = getCurrentPage();

  useEffect(() => {
    fetchMovies();
    fetchPeers();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    socket.on('peer-discovered', (peer) => {
      setPeers((prev) => {
        if (prev.find((p) => p.id === peer.id)) return prev;
        return [...prev, peer];
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('peer-discovered');
    };
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/movies');
      const data = await res.json();
      setMovies(data);
      setIsOffline(false);
    } catch (error) {
      console.error('Failed to fetch movies, trying offline cache:', error);
      try {
        const res = await fetch('http://localhost:3000/api/movies/offline');
        const data = await res.json();
        setMovies(data);
        setIsOffline(true);
      } catch {
        console.error('Offline cache unavailable');
      }
    }
  };

  const fetchPeers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/peers');
      const data = await res.json();
      setPeers(data);
    } catch (error) {
      console.error('Failed to fetch peers');
      setPeers([]);
    }
  };

  return (
    <div className="app-container">
      <WatchPartyNotification socket={socket} />

      <nav className="app-nav">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          🎬 BingeBox
        </h1>

        {/* Show navigation on main pages */}
        {currentPage !== 'none' && (
          <div className="app-nav-buttons">
            <button
              className={currentPage === 'catalog' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              Catalog
            </button>
            <button
              className={currentPage === 'peers' ? 'active' : ''}
              onClick={() => navigate('/peers')}
            >
              Peers ({peers.length})
            </button>
            {isOffline && (
              <span className="offline-indicator">📡 Offline Mode</span>
            )}
          </div>
        )}

        {/* Show back button on watch pages */}
        {currentPage === 'none' && (
          <button 
            onClick={() => navigate('/')}
            style={{ 
              backgroundColor: 'transparent', 
              border: '1px solid #374151',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem'
            }}
          >
            ← Back to Catalog
          </button>
        )}
      </nav>

      <main className="app-content">
        <Routes>
          <Route
            path="/"
            element={<Catalog movies={movies} peers={peers} isOffline={isOffline} />}
          />
          <Route path="/peers" element={<Peers />} />
          <Route path="/watch/:movieId" element={<Player />} />
          <Route path="/watch-party/:id" element={<WatchParty />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;