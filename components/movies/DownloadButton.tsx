'use client';

import { useState, useEffect } from 'react';
import { useMediaCache } from '@/contexts/MediaCacheContext';

interface DownloadButtonProps {
  tmdbId: number;
  title: string;
}

export default function DownloadButton({ tmdbId }: DownloadButtonProps) {
  const { getMegaFileByTmdbId } = useMediaCache();
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const megaFile = getMegaFileByTmdbId(tmdbId);

  // Prevent navigation during download
  useEffect(() => {
    if (!downloading) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [downloading]);

  if (!megaFile) {
    return null; // Movie not available in mega share
  }

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadProgress(0);

      const stream = megaFile.file.download({});
      const fileSize = megaFile.file.size || 0;
      let downloadedBytes = 0;

      // Check if File System Access API is available
      if ('showSaveFilePicker' in window) {
        // Use File System Access API for direct writing
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: megaFile.filename,
          types: [{
            description: 'Video Files',
            accept: { 'video/mp4': ['.mp4'] },
          }],
        });

        const writable = await fileHandle.createWritable();

        // Write chunks directly to file
        await new Promise<void>((resolve, reject) => {
          stream.on('data', async (chunk: Uint8Array) => {
            await writable.write(chunk);
            downloadedBytes += chunk.length;
            if (fileSize > 0) {
              setDownloadProgress(Math.round((downloadedBytes / fileSize) * 100));
            }
          });

          stream.on('end', async () => {
            await writable.close();
            resolve();
          });

          stream.on('error', async (error: Error) => {
            await writable.close();
            reject(error);
          });
        });
      } else {
        // Fallback: collect chunks and download as blob
        const chunks: Uint8Array[] = [];

        await new Promise<void>((resolve, reject) => {
          stream.on('data', (chunk: Uint8Array) => {
            chunks.push(chunk);
            downloadedBytes += chunk.length;
            if (fileSize > 0) {
              setDownloadProgress(Math.round((downloadedBytes / fileSize) * 100));
            }
          });

          stream.on('end', () => {
            resolve();
          });

          stream.on('error', (error: Error) => {
            reject(error);
          });
        });

        // Create blob from chunks
        const blob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = megaFile.filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
    >
      {downloading ? (
        <>
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {downloadProgress > 0 ? `Downloading... ${downloadProgress}%` : 'Starting download...'}
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download from Mega
        </>
      )}
    </button>
  );
}
