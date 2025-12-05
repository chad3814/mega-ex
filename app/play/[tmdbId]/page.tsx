'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import Breadcrumb from '@/components/Breadcrumb';
import { isFastStartMP4 } from '@/lib/utils/mp4-parser';

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const tmdbId = parseInt(params.tmdbId as string);
  const { getMegaFileByTmdbId, getMovieData } = useMediaCache();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isFastStart, setIsFastStart] = useState<boolean | null>(null);

  const megaFile = getMegaFileByTmdbId(tmdbId);
  const movieData = megaFile ? getMovieData(megaFile.cleanTitle, megaFile.year) : null;

  useEffect(() => {
    if (!megaFile) {
      setError('Movie file not found in mega share');
      setIsBuffering(false);
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

            // Auto-pumper: process queue when sourceBuffer is ready
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

            let firstChunkReceived = false;

            stream.on('data', (chunk: Uint8Array) => {
              // Check first chunk for fast-start
              if (!firstChunkReceived && chunk.length > 0) {
                firstChunkReceived = true;
                const fastStart = isFastStartMP4(chunk);
                setIsFastStart(fastStart);
                console.log('MP4 Fast-start:', fastStart);
              }

              queueRef.current.push(chunk);
              totalBytes += chunk.length;

              if (fileSize > 0) {
                setBufferProgress(Math.round((totalBytes / fileSize) * 100));
              }

              processQueue();

              // Start playing after first few chunks
              if (totalBytes > 1024 * 1024 && isBuffering) {
                setIsBuffering(false);
              }
            });

            stream.on('end', () => {
              setIsBuffering(false);
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
              setIsBuffering(false);
            });

          } catch (err) {
            console.error('SourceBuffer error:', err);
            setError('Failed to initialize video player');
            setIsBuffering(false);
          }
        });

      } catch (err) {
        console.error('Player setup error:', err);
        setError('Failed to setup video player');
        setIsBuffering(false);
      }
    };

    setupPlayer();

    return () => {
      if (mediaSourceRef.current) {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      }
      if (videoRef.current && videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
        videoRef.current.src = '';
      }
    };
  }, [megaFile, isBuffering]);

  // Prevent navigation during buffering
  useEffect(() => {
    if (isBuffering && bufferProgress > 0 && bufferProgress < 100) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isBuffering, bufferProgress]);

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

            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Buffering... {bufferProgress}%</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Fast-start videos will play immediately
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-400">
              Streaming from mega.nz • {bufferProgress}% buffered
            </p>
            {isFastStart === false && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-200">
                  ⚠️ This video is not web-optimized (moov atom at end).
                  Playback may not start until file is fully buffered.
                </p>
                <p className="text-xs text-yellow-300 mt-1">
                  To fix: <code className="bg-black/30 px-1 py-0.5 rounded">ffmpeg -i input.mp4 -movflags +faststart -c copy output.mp4</code>
                </p>
              </div>
            )}
            {isFastStart === true && (
              <p className="text-sm text-green-400">
                ✓ Web-optimized video - streaming playback enabled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
