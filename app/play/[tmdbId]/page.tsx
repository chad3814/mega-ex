'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import Breadcrumb from '@/components/Breadcrumb';

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const tmdbId = parseInt(params.tmdbId as string);
  const { getMegaFileByTmdbId, getMovieData } = useMediaCache();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bufferProgress, setBufferProgress] = useState(0);

  const megaFile = getMegaFileByTmdbId(tmdbId);
  const movieData = megaFile ? getMovieData(megaFile.cleanTitle, megaFile.year) : null;

  useEffect(() => {
    if (!megaFile) {
      setError('Movie file not found in mega share');
      setLoading(false);
      return;
    }

    const setupPlayer = async () => {
      try {
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(mediaSource);
        }

        mediaSource.addEventListener('sourceopen', () => {
          try {
            const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
            sourceBufferRef.current = sourceBuffer;

            let totalBytes = 0;
            const fileSize = megaFile.file.size || 0;

            // Process queue when sourceBuffer is ready
            const processQueue = () => {
              if (sourceBuffer.updating || queueRef.current.length === 0) return;

              const chunk = queueRef.current.shift();
              if (chunk) {
                sourceBuffer.appendBuffer(chunk as unknown as BufferSource);
              }
            };

            sourceBuffer.addEventListener('updateend', processQueue);

            // Start downloading from mega
            const stream = megaFile.file.download({});

            stream.on('data', (chunk: Uint8Array) => {
              queueRef.current.push(chunk);
              totalBytes += chunk.length;

              if (fileSize > 0) {
                setBufferProgress(Math.round((totalBytes / fileSize) * 100));
              }

              processQueue();
            });

            stream.on('end', () => {
              setLoading(false);
              // Wait for queue to empty before ending
              const checkQueue = setInterval(() => {
                if (queueRef.current.length === 0 && !sourceBuffer.updating) {
                  clearInterval(checkQueue);
                  if (mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                  }
                }
              }, 100);
            });

            stream.on('error', (err: Error) => {
              console.error('Stream error:', err);
              setError('Failed to stream video');
              setLoading(false);
            });

          } catch (err) {
            console.error('SourceBuffer error:', err);
            setError('Failed to initialize video player');
            setLoading(false);
          }
        });

      } catch (err) {
        console.error('Player setup error:', err);
        setError('Failed to setup video player');
        setLoading(false);
      }
    };

    setupPlayer();

    return () => {
      if (mediaSourceRef.current) {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      }
      if (videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [megaFile]);

  // Prevent navigation during buffering
  useEffect(() => {
    if (!loading && bufferProgress < 100) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [loading, bufferProgress]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4">
        <Breadcrumb
          items={[
            { label: 'Movies', href: '/movies' },
            { label: movieData?.title || megaFile?.cleanTitle || 'Movie', href: `/movie/${tmdbId}` },
            { label: 'Play', href: `/play/${tmdbId}` },
          ]}
        />
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          {movieData && (
            <h1 className="text-3xl font-bold mb-6">{movieData.title}</h1>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls
              className="w-full"
              autoPlay
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Buffering... {bufferProgress}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>Streaming from mega.nz</p>
            {bufferProgress < 100 && !loading && (
              <p>Buffered: {bufferProgress}%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
