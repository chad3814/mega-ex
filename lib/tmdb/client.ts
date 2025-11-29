import {
  TMDBMovie,
  TMDBSearchResult,
  TMDBPerson,
  TMDBCollection,
} from '@/types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY as string;

if (!API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

export async function searchMovies(
  query: string,
  year?: number
): Promise<TMDBSearchResult> {
  const params = new URLSearchParams();
  params.append('api_key', API_KEY);
  params.append('query', query);

  if (year) {
    params.append('year', year.toString());
  }

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  const params = new URLSearchParams();
  params.append('api_key', API_KEY);
  params.append('append_to_response', 'credits');

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?${params}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getPersonDetails(personId: number): Promise<TMDBPerson> {
  const params = new URLSearchParams();
  params.append('api_key', API_KEY);
  params.append('append_to_response', 'movie_credits');

  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}?${params}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getCollectionDetails(
  collectionId: number
): Promise<TMDBCollection> {
  const params = new URLSearchParams();
  params.append('api_key', API_KEY);

  const response = await fetch(
    `${TMDB_BASE_URL}/collection/${collectionId}?${params}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}
