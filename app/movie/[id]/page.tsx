'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Movie } from '@/types/movie';
import { PersonRole, Role } from '@/types/person';
import { numberToDate } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

async function getMovieData(id: string): Promise<Movie | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/tmdb/movie/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return numberToDate(await response.json()) as Movie;
}

function calculateAge(birthday: string, deathday?: string | null): number {
  const birthDate = new Date(birthday);
  const endDate = deathday ? new Date(deathday) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = endDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function MoviePage({ params }: MoviePageProps) {
  const [movie, setMovie] = useState<Movie|null>(null);
  const [fetched, setFetched] = useState(false);
  const id = useParams().id as string;

  useEffect(() => {
    async function fetchMovie() {
      const movieData = await getMovieData(id);
      setMovie(movieData);
      setFetched(true);
    }
    fetchMovie();
  }, [id, setMovie, setFetched]);

  if (!fetched) {
    return null;
  }
  if (!movie) {
    notFound();
  }

  const directors = movie.people?.filter(
    (p: PersonRole) => p.role === Role.director
  ).map(
    (d: PersonRole) => d.person
  ) || [];

  const actors = movie.people?.filter(
    (p: PersonRole) => p.role === Role.actor
  ).map(
    (a: PersonRole) => ({
      ...a.person,
      character: a.character,
    })
  ) || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {movie.backdropPath && (
        <div className="relative h-96 w-full">
          <Image
            src={`${TMDB_IMAGE_BASE}/original${movie.backdropPath}`}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 -mt-64 relative z-10">
        <div className="flex gap-8 mb-8">
          {movie.posterPath && (
            <div className="flex-shrink-0">
              <div className="relative w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={`${TMDB_IMAGE_BASE}/w500${movie.posterPath}`}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1 pt-32">
            <h1 className="text-5xl font-bold mb-2">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-xl text-gray-400 italic mb-4">{movie.tagline}</p>
            )}

            <div className="flex gap-4 mb-6 text-sm">
              {movie.releaseDate && (
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
              )}
              {movie.runtime && <span>{movie.runtime} min</span>}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre: { id: number; name: string }) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {movie.overview && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {directors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">Directors</h2>
                <div className="flex flex-wrap gap-4">
                  {directors.map(
                    (director: { tmdbId: number; name: string; profilePath: string | null}) => (
                        <Link
                            key={director.tmdbId}
                            href={`/person/${director.tmdbId}`}
                            className="flex items-center gap-3 group"
                            >
                            {director.profilePath && (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                <Image
                                    src={`${TMDB_IMAGE_BASE}/w185${director.profilePath}`}
                                    alt={director.name}
                                    fill
                                    className="object-cover"
                                />
                                </div>
                            )}
                            <span className="group-hover:text-blue-400 transition">
                                {director.name}
                            </span>
                        </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {actors.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Cast</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {actors.map(
                (actor: { tmdbId: number; name: string; profilePath: string | null; character: string | null}) => (
                    <Link
                    key={actor.tmdbId}
                    href={`/person/${actor.tmdbId}`}
                    className="group"
                    >
                    <div className="bg-gray-900 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
                        {actor.profilePath ? (
                        <div className="relative aspect-[2/3]">
                            <Image
                            src={`${TMDB_IMAGE_BASE}/w185${actor.profilePath}`}
                            alt={actor.name}
                            fill
                            className="object-cover"
                            />
                        </div>
                        ) : (
                        <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center">
                            <svg
                            className="w-16 h-16 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            >
                            <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                            />
                            </svg>
                        </div>
                        )}
                        <div className="p-3">
                        <p className="font-semibold text-sm group-hover:text-blue-400 transition">
                            {actor.name}
                        </p>
                        {actor.character && (
                            <p className="text-xs text-gray-400 mt-1">{actor.character}</p>
                        )}
                        </div>
                    </div>
                    </Link>
              ))}
            </div>
          </div>
        )}

        {movie.collections && movie.collections.map((collection) => (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Collections</h2>
            <Link
              href={`/collection/${collection.tmdbId}`}
              className="inline-block group"
            >
              <div className="flex items-center gap-4 bg-gray-900 rounded-lg p-4 transition-transform duration-200 group-hover:scale-105">
                {collection.posterPath && (
                  <div className="relative w-24 aspect-[2/3] rounded overflow-hidden">
                    <Image
                      src={`${TMDB_IMAGE_BASE}/w185${collection.posterPath}`}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold group-hover:text-blue-400 transition">
                    {collection.name}
                  </p>
                  {collection.overview && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {collection.overview}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}

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
