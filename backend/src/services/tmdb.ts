// services/tmdb.ts
import axios from 'axios';

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.error('⚠️ Missing TMDB_API_KEY in environment variables');
}

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: API_KEY },
});

export async function searchMovie(query: string) {
  try {
    const res = await api.get('/search/movie', { params: { query } });
    return res.data.results[0];
  } catch (error: any) {
    console.error('TMDb search failed:', error.response?.data || error.message);
    return null;
  }
}

export async function getMovieDetails(id: number) {
  try {
    const res = await api.get(`/movie/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('TMDb details failed:', error.response?.data || error.message);
    return null;
  }
}

export async function getTrailer(id: number) {
  try {
    const res = await api.get(`/movie/${id}/videos`);
    const trailer = res.data.results.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    );
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  } catch (error: any) {
    console.error('TMDb trailer failed:', error.response?.data || error.message);
    return null;
  }
}
