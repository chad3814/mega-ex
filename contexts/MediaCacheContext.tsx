'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useMega } from './MegaContext';
import { getAllFilesRecursive, MegaFileItem } from '@/lib/utils/mega-navigation';
import { getCachedResult, setCachedResult, clearOldCache } from '@/lib/utils/indexeddb';

interface TMDBMovieResult {
  tmdbId: number;
  posterPath: string | null;
  title: string;
  releaseDate: string;
}

interface TMDBShowResult {
  tmdbId: number;
  posterPath: string | null;
  name: string;
  firstAirDate: string;
}

interface MediaCacheContextType {
  getMovieData: (cleanTitle: string, year: number | null) => TMDBMovieResult | null;
  getShowData: (cleanTitle: string) => TMDBShowResult | null;
  isMovieAvailable: (tmdbId: number) => boolean;
  getMovieFiles: (tmdbId: number) => string[];
  getMegaFileByTmdbId: (tmdbId: number) => MegaFileItem | null;
  isProcessing: boolean;
  queueProgress: { current: number; total: number };
}

const MediaCacheContext = createContext<MediaCacheContextType | undefined>(undefined);

interface QueueItem {
  type: 'movie' | 'show';
  title: string;
  year: number | null;
  key: string;
}

export function MediaCacheProvider({ children }: { children: ReactNode }) {
  const { rootFile } = useMega();
  const [cache, setCache] = useState<Map<string, TMDBMovieResult | TMDBShowResult>>(new Map());
  const [tmdbIdToFiles, setTmdbIdToFiles] = useState<Map<number, string[]>>(new Map());
  const [tmdbIdToMegaFile, setTmdbIdToMegaFile] = useState<Map<number, MegaFileItem>>(new Map());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [queueProgress, setQueueProgress] = useState({ current: 0, total: 0 });
  const processingRef = useRef(false);

  // Initialize cache from IndexedDB and clear old entries
  useEffect(() => {
    clearOldCache();
  }, []);

  // When rootFile changes, scan all files and queue lookups
  useEffect(() => {
    if (!rootFile || !rootFile.directory) {
      setQueue([]);
      return;
    }

    const scanFiles = async () => {
      const allFiles = getAllFilesRecursive(rootFile);
      const newQueue: QueueItem[] = [];
      const newCache = new Map<string, TMDBMovieResult | TMDBShowResult>();
      const newMapping = new Map<number, string[]>();
      const newMegaFileMap = new Map<number, MegaFileItem>();

      for (const file of allFiles) {
        if (file.mediaType === 'movie' || (file.mediaType === 'unknown' && !file.episodeInfo)) {
          const key = `movie:${file.cleanTitle}:${file.year || 'unknown'}`;

          // Check IndexedDB cache first
          const cached = await getCachedResult(key);
          if (cached && cached.tmdbId) {
            newCache.set(key, cached.data as TMDBMovieResult);

            // Build tmdbId -> filenames mapping
            const tmdbId = cached.tmdbId;
            const existing = newMapping.get(tmdbId) || [];
            existing.push(file.filename);
            newMapping.set(tmdbId, existing);

            // Store first file reference for download links
            if (!newMegaFileMap.has(tmdbId)) {
              newMegaFileMap.set(tmdbId, file);
            }
          } else {
            newQueue.push({
              type: 'movie',
              title: file.cleanTitle,
              year: file.year,
              key,
            });
          }
        } else if (file.mediaType === 'tv') {
          const key = `show:${file.cleanTitle}`;

          const cached = await getCachedResult(key);
          if (cached && cached.tmdbId) {
            newCache.set(key, cached.data as TMDBShowResult);
          } else {
            // Check if already in queue for this show
            if (!newQueue.some(q => q.key === key)) {
              newQueue.push({
                type: 'show',
                title: file.cleanTitle,
                year: null,
                key,
              });
            }
          }
        }
      }

      setCache(newCache);
      setTmdbIdToFiles(newMapping);
      setTmdbIdToMegaFile(newMegaFileMap);
      setQueue(newQueue);
      setQueueProgress({ current: 0, total: newQueue.length });
    };

    scanFiles();
  }, [rootFile]);

  // Background queue processor
  useEffect(() => {
    if (queue.length === 0 || processingRef.current) return;

    const processQueue = async () => {
      processingRef.current = true;
      setProcessing(true);

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        // Check if already cached (might have been fetched by component)
        const existingCache = cache.get(item.key);
        if (existingCache) {
          setQueueProgress({ current: i + 1, total: queue.length });
          continue;
        }

        try {
          if (item.type === 'movie') {
            const response = await fetch('/api/tmdb/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: item.title,
                year: item.year,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const movieData: TMDBMovieResult = {
                  tmdbId: result.id,
                  posterPath: result.poster_path,
                  title: result.title,
                  releaseDate: result.release_date,
                };

                // Store in IndexedDB
                await setCachedResult({
                  key: item.key,
                  tmdbId: result.id,
                  data: movieData,
                  timestamp: Date.now(),
                });

                // Update in-memory cache
                setCache(prev => new Map(prev).set(item.key, movieData));

                // Update tmdbId mapping
                setTmdbIdToFiles(prev => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(result.id) || [];
                  // Extract filename from key (format: "movie:Title:Year")
                  const filename = item.title + (item.year ? ` (${item.year})` : '') + '.mp4';
                  if (!existing.includes(filename)) {
                    existing.push(filename);
                  }
                  newMap.set(result.id, existing);
                  return newMap;
                });
              } else {
                // Store null result to avoid re-querying
                await setCachedResult({
                  key: item.key,
                  tmdbId: null,
                  data: null,
                  timestamp: Date.now(),
                });
              }
            }
          }

          // Throttle requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Error processing queue item:', item, error);
        }

        setQueueProgress({ current: i + 1, total: queue.length });
      }

      setProcessing(false);
      processingRef.current = false;
      setQueue([]);
    };

    processQueue();
  }, [queue, cache]);

  const getMovieData = useCallback((cleanTitle: string, year: number | null): TMDBMovieResult | null => {
    const key = `movie:${cleanTitle}:${year || 'unknown'}`;
    return (cache.get(key) as TMDBMovieResult) || null;
  }, [cache]);

  const getShowData = useCallback((cleanTitle: string): TMDBShowResult | null => {
    const key = `show:${cleanTitle}`;
    return (cache.get(key) as TMDBShowResult) || null;
  }, [cache]);

  const isMovieAvailable = useCallback((tmdbId: number): boolean => {
    return tmdbIdToFiles.has(tmdbId);
  }, [tmdbIdToFiles]);

  const getMovieFiles = useCallback((tmdbId: number): string[] => {
    return tmdbIdToFiles.get(tmdbId) || [];
  }, [tmdbIdToFiles]);

  const getMegaFileByTmdbId = useCallback((tmdbId: number): MegaFileItem | null => {
    return tmdbIdToMegaFile.get(tmdbId) || null;
  }, [tmdbIdToMegaFile]);

  return (
    <MediaCacheContext.Provider
      value={{
        getMovieData,
        getShowData,
        isMovieAvailable,
        getMovieFiles,
        getMegaFileByTmdbId,
        isProcessing: processing,
        queueProgress,
      }}
    >
      {children}
    </MediaCacheContext.Provider>
  );
}

export function useMediaCache() {
  const context = useContext(MediaCacheContext);
  if (context === undefined) {
    throw new Error('useMediaCache must be used within a MediaCacheProvider');
  }
  return context;
}
