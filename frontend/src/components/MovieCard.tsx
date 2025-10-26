import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <div className="movie-card" onClick={onClick}>
      {movie.poster ? (
        <img
        src={movie.poster}
        alt={movie.title}
        className="movie-card-poster"
        />
      ) : (
        <div className="movie-card-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {movie.title}
        </div>
      )}
      <p className="movie-card-title">{movie.title}</p>
    </div>
  )
}