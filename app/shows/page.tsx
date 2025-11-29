'use client';

import { useState, useEffect } from 'react';
import { useMega } from '@/contexts/MegaContext';
import { getAllFilesRecursive, MegaFileItem } from '@/lib/utils/mega-navigation';
import { searchAndCacheShow } from '@/lib/tmdb/tv-cache';
import ShowCard from '@/components/shows/ShowCard';
import Breadcrumb from '@/components/Breadcrumb';
import { Show } from '@/types/show';

export default function ShowsPage() {
  const { rootFile } = useMega();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rootFile && rootFile.directory) {
      setLoading(true);
      const loadShows = async () => {
        try {
          const allFiles = getAllFilesRecursive(rootFile);
          const episodeFiles = allFiles.filter(item => item.mediaType === 'tv');

          // Group by show title
          const showMap = new Map<string, MegaFileItem[]>();
          episodeFiles.forEach(episode => {
            const title = episode.cleanTitle;
            if (!showMap.has(title)) {
              showMap.set(title, []);
            }
            showMap.get(title)!.push(episode);
          });

          // Fetch show info from TMDB for unique shows
          const showPromises = Array.from(showMap.keys()).map(async (title) => {
            try {
              const show = await searchAndCacheShow(title);
              return show;
            } catch (err) {
              console.error(`Failed to fetch show: ${title}`, err);
              return null;
            }
          });

          const fetchedShows = (await Promise.all(showPromises))
            .filter((show): show is Show => show !== null)
            .sort((a, b) => a.name.localeCompare(b.name));

          setShows(fetchedShows);
        } catch (err) {
          console.error('Error getting shows:', err);
          setShows([]);
        } finally {
          setLoading(false);
        }
      };

      loadShows();
    } else {
      setShows([]);
      setLoading(false);
    }
  }, [rootFile]);

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label: 'Shows', href: '/shows' }]} />

      <h1 className="text-4xl font-bold mb-8">All TV Shows</h1>

      {loading && (
        <div className="text-center text-gray-400 py-12">Loading shows...</div>
      )}

      {!loading && shows.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          No TV shows found. Please load a mega.nz share from the home page.
        </div>
      )}

      {!loading && shows.length > 0 && (
        <>
          <p className="text-gray-400 mb-6">{shows.length} shows</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {shows.map((show) => (
              <ShowCard
                key={show.id}
                show={{
                  id: show.id,
                  name: show.name,
                  posterPath: show.posterPath,
                  firstAirDate: show.firstAirDate,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
