'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMega } from '@/contexts/MegaContext';
import { getAllFilesRecursive, MegaFileItem } from '@/lib/utils/mega-navigation';
import MovieGrid from '@/components/movies/MovieGrid';
import Breadcrumb from '@/components/Breadcrumb';

const ITEMS_PER_PAGE = 30;

export default function MoviesPage() {
  const { rootFile } = useMega();
  const [allMovies, setAllMovies] = useState<MegaFileItem[]>([]);
  const [displayedMovies, setDisplayedMovies] = useState<MegaFileItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootFile && rootFile.directory) {
      setLoading(true);
      try {
        const allFiles = getAllFilesRecursive(rootFile);
        const movieFiles = allFiles
          .filter(item =>
            item.mediaType === 'movie' ||
            (item.mediaType === 'unknown' && !item.episodeInfo)
          )
          .sort((a, b) => a.cleanTitle.localeCompare(b.cleanTitle));
        setAllMovies(movieFiles);
        setDisplayedMovies(movieFiles.slice(0, ITEMS_PER_PAGE));
        setPage(1);
        setHasMore(movieFiles.length > ITEMS_PER_PAGE);
      } catch (err) {
        console.error('Error getting movies:', err);
        setAllMovies([]);
        setDisplayedMovies([]);
      } finally {
        setLoading(false);
      }
    } else {
      setAllMovies([]);
      setDisplayedMovies([]);
      setLoading(false);
    }
  }, [rootFile]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const nextPage = page + 1;
    const start = 0;
    const end = nextPage * ITEMS_PER_PAGE;
    const newDisplayed = allMovies.slice(start, end);

    setDisplayedMovies(newDisplayed);
    setPage(nextPage);
    setHasMore(end < allMovies.length);
  }, [page, allMovies, hasMore]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loading]);

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label: 'Movies', href: '/movies' }]} />

      <h1 className="text-4xl font-bold mb-8">All Movies</h1>

      {loading && (
        <div className="text-center text-gray-400 py-12">Loading movies...</div>
      )}

      {!loading && allMovies.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          No movies found. Please load a mega.nz share from the home page.
        </div>
      )}

      {!loading && allMovies.length > 0 && (
        <>
          <p className="text-gray-400 mb-6">
            Showing {displayedMovies.length} of {allMovies.length} movies
          </p>
          <MovieGrid movies={displayedMovies} />

          {hasMore && (
            <div
              ref={loadMoreRef}
              className="text-center text-gray-400 py-12"
            >
              Loading more movies...
            </div>
          )}
        </>
      )}
    </div>
  );
}
