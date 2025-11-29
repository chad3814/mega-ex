'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Collection } from '@/types/movie';
import { numberToDate } from '@/lib/utils/date';

const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

interface CollectionWithParts extends Collection {
  parts: { id: number; title: string; poster_path: string | null; release_date: string }[];
}

async function getCollectionData(id: string): Promise<CollectionWithParts | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/tmdb/collection/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return numberToDate(await response.json()) as CollectionWithParts;
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const [id, setId] = useState<string>('');
  const [collection, setCollection] = useState<CollectionWithParts | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchCollection() {
      const collectionData = await getCollectionData(id);
      setCollection(collectionData);
      setFetched(true);
    }
    fetchCollection();
  }, [id]);

  if (!fetched) {
    return null;
  }

  if (!collection) {
    notFound();
  }

  const movies = collection.parts || [];

  const sortedMovies = [...movies].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {collection.backdropPath && (
        <div className="relative h-96 w-full">
          <Image
            src={`${TMDB_IMAGE_BASE}/original${collection.backdropPath}`}
            alt={collection.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 -mt-32 relative z-10">
        <div className="flex gap-8 mb-12">
          {collection.posterPath && (
            <div className="flex-shrink-0">
              <div className="relative w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={`${TMDB_IMAGE_BASE}/w500${collection.posterPath}`}
                  alt={collection.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1 pt-20">
            <h1 className="text-5xl font-bold mb-6">{collection.name}</h1>

            {collection.overview && (
              <div>
                <h2 className="text-2xl font-bold mb-3">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{collection.overview}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Movies ({sortedMovies.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  {movie.poster_path ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE}/w500${movie.poster_path}`}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center">
                      <p className="text-sm text-gray-400">{movie.title}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {movie.title}
                    </h3>
                    {movie.release_date && (
                      <p className="text-xs text-gray-300">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition mb-12"
        >
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}
