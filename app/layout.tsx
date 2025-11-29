import type { Metadata } from 'next';
import './globals.css';
import { MegaProvider } from '@/contexts/MegaContext';

export const metadata: Metadata = {
  title: 'Mega.nz Movie Browser',
  description: 'Browse and discover movies from mega.nz shares with TMDB integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MegaProvider>{children}</MegaProvider>
      </body>
    </html>
  );
}
