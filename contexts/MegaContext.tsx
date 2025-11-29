'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { File } from 'megajs';

interface MegaContextType {
  shareUrl: string | null;
  setShareUrl: (url: string) => void;
  rootFile: File | null;
  isLoading: boolean;
  error: string | null;
  clearShare: () => void;
}

const MegaContext = createContext<MegaContextType | undefined>(undefined);

const STORAGE_KEY = 'mega-browser-url';

export function MegaProvider({ children }: { children: ReactNode }) {
  const [shareUrl, setShareUrlState] = useState<string | null>(null);
  const [rootFile, setRootFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setShareUrlState(stored);
    }
  }, []);

  // Load File object when URL changes
  useEffect(() => {
    if (!shareUrl) {
      setRootFile(null);
      return;
    }

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const file = File.fromURL(shareUrl);

        await new Promise<void>((resolve, reject) => {
          file.loadAttributes((error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        setRootFile(file);
      } catch (err) {
        console.error('Error loading mega.nz file:', err);
        setError('Failed to load mega.nz share. Please check the URL.');
        setRootFile(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [shareUrl]);

  const setShareUrl = (url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
    setShareUrlState(url);
  };

  const clearShare = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShareUrlState(null);
    setRootFile(null);
    setError(null);
  };

  return (
    <MegaContext.Provider
      value={{
        shareUrl,
        setShareUrl,
        rootFile,
        isLoading,
        error,
        clearShare,
      }}
    >
      {children}
    </MegaContext.Provider>
  );
}

export function useMega() {
  const context = useContext(MegaContext);
  if (context === undefined) {
    throw new Error('useMega must be used within a MegaProvider');
  }
  return context;
}
