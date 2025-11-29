'use client';

import Link from 'next/link';
import Image from 'next/image';

interface MovieCardProps {
  movie: {
    tmdbId?: number;
    posterPath?: string;
    title?: string;
    cleanTitle: string;
    releaseDate?: string;
  };
}

const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

export default function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = movie.posterPath
    ? `${TMDB_IMAGE_BASE}/w500${movie.posterPath}`
    : null;

  const displayTitle = movie.title || movie.cleanTitle;
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  if (!movie.tmdbId) {
    return (
      <div className="group cursor-not-allowed">
        <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-sm text-gray-400 mb-2">Not Found</p>
            <p className="text-xs text-gray-500">{movie.cleanTitle}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/movie/${movie.tmdbId}`} className="group">
      <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105 group-hover:shadow-xl">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <p className="text-sm text-gray-400">{displayTitle}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{displayTitle}</h3>
          {year && <p className="text-xs text-gray-300">{year}</p>}
        </div>
      </div>
    </Link>
  );
}
