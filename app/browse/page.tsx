'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMega } from '@/contexts/MegaContext';
import { getDirectoryContents, isMegaFile, isMegaDirectory, MegaItem } from '@/lib/utils/mega-navigation';
import MovieGrid from '@/components/movies/MovieGrid';
import DirectoryGrid from '@/components/movies/DirectoryGrid';
import Link from 'next/link';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const path = searchParams.get('path');
  const { rootFile, isLoading: contextLoading } = useMega();

  const [items, setItems] = useState<MegaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rootFile) {
      setError('No mega.nz share loaded');
      return;
    }

    try {
      const pathSegments = path ? path.split('/').filter(Boolean) : [];
      const contents = getDirectoryContents(rootFile, pathSegments);
      setItems(contents);
      setError(null);
    } catch (err) {
      console.error('Error getting directory contents:', err);
      setError('Failed to load directory');
      setItems([]);
    }
  }, [rootFile, path]);

  const movies = items.filter(isMegaFile).filter(item => item.mediaType === 'movie');
  const directories = items.filter(isMegaDirectory);

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-400">Loading directory...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-xl text-red-500 mb-4">{error}</div>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              ← Back to Home
            </Link>
            {path && (
              <>
                <span className="text-gray-600">|</span>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                  ↑ Root Directory
                </Link>
              </>
            )}
          </div>
          <h1 className="text-4xl font-bold">Browse Directory</h1>
        </div>

        {directories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Directories</h2>
            <DirectoryGrid directories={directories} />
          </div>
        )}

        {movies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Movies ({movies.length})</h2>
            <MovieGrid movies={movies} />
          </div>
        )}

        {items.length === 0 && (
          <p className="text-gray-400 text-center">No movies or directories found.</p>
        )}
      </div>
    </div>
  );
}
