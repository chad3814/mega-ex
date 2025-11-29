import type { Metadata } from 'next';
import './globals.css';
import { MegaProvider } from '@/contexts/MegaContext';
import { MediaCacheProvider } from '@/contexts/MediaCacheContext';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Mega.nz Media Browser',
  description: 'Browse and discover movies and TV shows from mega.nz shares with TMDB integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-white">
        <MegaProvider>
          <MediaCacheProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </MediaCacheProvider>
        </MegaProvider>
      </body>
    </html>
  );
}
