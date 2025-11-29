'use client';

import { useState, useEffect } from 'react';
import { MegaFileItem } from '@/lib/utils/mega-navigation';
import MovieCard from './MovieCard';

interface MovieGridProps {
  movies: MegaFileItem[];
}

interface MovieWithTMDB {
  cleanTitle: string;
  year: number | null;
  tmdbId?: number;
  posterPath?: string;
  title?: string;
  releaseDate?: string;
}

export default function MovieGrid({ movies }: MovieGridProps) {
  const [moviesWithData, setMoviesWithData] = useState<MovieWithTMDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);

      const results = await Promise.all(
        movies.map(async (movie) => {
          try {
            const response = await fetch('/api/tmdb/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: movie.cleanTitle,
                year: movie.year,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const firstResult = data.results[0];
                return {
                  cleanTitle: movie.cleanTitle,
                  year: movie.year,
                  tmdbId: firstResult.id,
                  posterPath: firstResult.poster_path,
                  title: firstResult.title,
                  releaseDate: firstResult.release_date,
                };
              }
            }
          } catch (error) {
            console.error('Error fetching movie data:', error);
          }

          return {
            cleanTitle: movie.cleanTitle,
            year: movie.year,
          };
        })
      );

      setMoviesWithData(results);
      setLoading(false);
    };

    fetchMovieData();
  }, [movies]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map((_, index) => (
          <div
            key={index}
            className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {moviesWithData.map((movie, index) => (
        <MovieCard key={index} movie={movie} />
      ))}
    </div>
  );
}
