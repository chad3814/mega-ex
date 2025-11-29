'use client';

import { useState, useEffect } from 'react';
import { useMega } from '@/contexts/MegaContext';
import { getDirectoryContents, isMegaFile, isMegaDirectory, MegaItem } from '@/lib/utils/mega-navigation';
import MovieGrid from '@/components/movies/MovieGrid';
import DirectoryGrid from '@/components/movies/DirectoryGrid';

export default function Home() {
  const { shareUrl, setShareUrl, rootFile, isLoading: contextLoading, error: contextError } = useMega();
  const [urlInput, setUrlInput] = useState('');
  const [items, setItems] = useState<MegaItem[]>([]);

  useEffect(() => {
    if (shareUrl) {
      setUrlInput(shareUrl);
    }
  }, [shareUrl]);

  useEffect(() => {
    if (rootFile && rootFile.directory) {
      try {
        const contents = getDirectoryContents(rootFile);
        setItems(contents);
      } catch (err) {
        console.error('Error getting directory contents:', err);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [rootFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setShareUrl(urlInput.trim());
    }
  };

  const movies = items.filter(isMegaFile).filter(item => item.mediaType === 'movie');
  const directories = items.filter(isMegaDirectory);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Mega.nz Movie Browser</h1>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex gap-4">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter mega.nz share URL..."
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={contextLoading || !urlInput}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {contextLoading ? 'Loading...' : 'Browse'}
            </button>
          </div>
          {contextError && <p className="text-red-500 mt-2">{contextError}</p>}
        </form>

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

        {!contextLoading && items.length === 0 && shareUrl && !contextError && (
          <p className="text-gray-400 text-center">No movies found in this mega.nz share.</p>
        )}
      </div>
    </div>
  );
}
