'use client';

import { useState, useEffect } from 'react';
import { useMega } from '@/contexts/MegaContext';
import { getRecentlyAddedMovies, getRecentlyAddedEpisodes, MegaFileItem } from '@/lib/utils/mega-navigation';
import MovieCardWithData from '@/components/movies/MovieCardWithData';
import EpisodeCardSimple from '@/components/episodes/EpisodeCardSimple';
import HorizontalList from '@/components/HorizontalList';

export default function Home() {
  const { shareUrl, setShareUrl, rootFile, isLoading: contextLoading, error: contextError } = useMega();
  const [urlInput, setUrlInput] = useState('');
  const [recentMovies, setRecentMovies] = useState<MegaFileItem[]>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<MegaFileItem[]>([]);

  useEffect(() => {
    if (shareUrl) {
      setUrlInput(shareUrl);
    }
  }, [shareUrl]);

  useEffect(() => {
    if (rootFile && rootFile.directory) {
      try {
        const movies = getRecentlyAddedMovies(rootFile, 20);
        const episodes = getRecentlyAddedEpisodes(rootFile, 20);
        setRecentMovies(movies);
        setRecentEpisodes(episodes);
      } catch (err) {
        console.error('Error getting recent content:', err);
        setRecentMovies([]);
        setRecentEpisodes([]);
      }
    } else {
      setRecentMovies([]);
      setRecentEpisodes([]);
    }
  }, [rootFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setShareUrl(urlInput.trim());
    }
  };

  return (
    <div className="p-8 overflow-hidden">
      <div className="max-w-full">
        <h1 className="text-4xl font-bold mb-8">Mega.nz Media Browser</h1>

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

        {recentMovies.length > 0 && (
          <HorizontalList title="Recently Added Movies" itemWidth={144}>
            {recentMovies.map((movie, index) => (
              <MovieCardWithData key={index} movie={movie} />
            ))}
          </HorizontalList>
        )}

        {recentEpisodes.length > 0 && (
          <HorizontalList title="Recently Added Episodes" itemWidth={240}>
            {recentEpisodes.map((episode, index) => (
              <EpisodeCardSimple key={index} episode={episode} />
            ))}
          </HorizontalList>
        )}

        {!contextLoading && recentMovies.length === 0 && recentEpisodes.length === 0 && shareUrl && !contextError && (
          <p className="text-gray-400 text-center">No content found in this mega.nz share.</p>
        )}
      </div>
    </div>
  );
}
