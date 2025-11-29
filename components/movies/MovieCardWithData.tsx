'use client';

import { useState, useEffect } from 'react';
import { MegaFileItem } from '@/lib/utils/mega-navigation';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import { getCachedResult, setCachedResult } from '@/lib/utils/indexeddb';
import MovieCard from './MovieCard';

interface MovieCardWithDataProps {
  movie: MegaFileItem;
}

interface MovieWithTMDB {
  cleanTitle: string;
  year: number | null;
  tmdbId?: number;
  posterPath?: string | null;
  title?: string;
  releaseDate?: string;
}

export default function MovieCardWithData({ movie }: MovieCardWithDataProps) {
  const { getMovieData } = useMediaCache();
  const [movieData, setMovieData] = useState<MovieWithTMDB>({
    cleanTitle: movie.cleanTitle,
    year: movie.year,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovieData = async () => {
      const key = `movie:${movie.cleanTitle}:${movie.year || 'unknown'}`;

      // First check in-memory cache
      const cached = getMovieData(movie.cleanTitle, movie.year);
      if (cached) {
        setMovieData({
          ...cached,
          cleanTitle: movie.cleanTitle,
          year: movie.year,
        });
        setLoading(false);
        return;
      }

      // Then check IndexedDB
      const dbCached = await getCachedResult(key);
      if (dbCached && dbCached.tmdbId) {
        const data = dbCached.data as any;
        setMovieData({
          cleanTitle: movie.cleanTitle,
          year: movie.year,
          tmdbId: data.tmdbId,
          posterPath: data.posterPath,
          title: data.title,
          releaseDate: data.releaseDate,
        });
        setLoading(false);
        return;
      }

      // If not cached, fetch immediately
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
            const resultData = {
              tmdbId: firstResult.id,
              posterPath: firstResult.poster_path,
              title: firstResult.title,
              releaseDate: firstResult.release_date,
            };

            // Cache in IndexedDB
            await setCachedResult({
              key,
              tmdbId: firstResult.id,
              data: resultData,
              timestamp: Date.now(),
            });

            setMovieData({
              cleanTitle: movie.cleanTitle,
              year: movie.year,
              ...resultData,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching movie data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovieData();
  }, [movie.cleanTitle, movie.year, getMovieData]);

  if (loading) {
    return (
      <div className="flex-shrink-0 w-36">
        <div className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return <MovieCard movie={movieData} />;
}
