'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Person, Role } from '@/types/person';
import { Movie } from '@/types/movie';
import { numberToDate } from '@/lib/utils/date';
import Breadcrumb from '@/components/Breadcrumb';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import { useMega } from '@/contexts/MegaContext';
import { getAllFilesRecursive } from '@/lib/utils/mega-navigation';

const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

interface PersonWithMovies extends Person {
  movies: { movie: Movie; role: Role; character: string | null }[];
}

async function getPersonData(id: string, availableMovieIds: number[]): Promise<PersonWithMovies | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/tmdb/person/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availableMovieIds }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return numberToDate(await response.json()) as PersonWithMovies;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PersonPage({ params }: PersonPageProps) {
  const [id, setId] = useState<string>('');
  const [person, setPerson] = useState<PersonWithMovies | null>(null);
  const [fetched, setFetched] = useState(false);
  const { rootFile } = useMega();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchPerson() {
      const availableMovieIds: number[] = [];

      // Get all movies from mega share and build list of tmdbIds
      if (rootFile && rootFile.directory) {
        const allFiles = getAllFilesRecursive(rootFile);

        for (const file of allFiles) {
          if (file.mediaType === 'movie' || (file.mediaType === 'unknown' && !file.episodeInfo)) {
            const key = `movie:${file.cleanTitle}:${file.year || 'unknown'}`;
            const cached = await import('@/lib/utils/indexeddb').then(m => m.getCachedResult(key));
            if (cached && cached.tmdbId) {
              availableMovieIds.push(cached.tmdbId);
            }
          }
        }
      }

      const personData = await getPersonData(id, availableMovieIds);
      setPerson(personData);
      setFetched(true);
    }
    fetchPerson();
  }, [id, rootFile]);

  if (!fetched) {
    return null;
  }

  if (!person) {
    notFound();
  }

  const age = person.birthday ? calculateAge(person.birthday, person.deathday) : null;
  const directedMovies = person.movies?.filter((m) => m.role === Role.director).map((d) => d.movie) || [];
  const actedMovies = person.movies?.filter((m) => m.role === Role.actor).map((a) => a.movie) || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <Breadcrumb
          items={[
            { label: 'People', href: '/people' },
            { label: person.name, href: `/person/${person.id}` },
          ]}
        />
        <div className="flex gap-8 mb-12">
          {person.profilePath && (
            <div className="flex-shrink-0">
              <div className="relative w-80 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={`${TMDB_IMAGE_BASE}/h632${person.profilePath}`}
                  alt={person.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-6">{person.name}</h1>

            <div className="space-y-3 mb-8">
              {person.birthday && (
                <div>
                  <span className="text-gray-400 font-semibold">Born: </span>
                  <span>{formatDate(person.birthday)}</span>
                  {age && !person.deathday && (
                    <span className="text-gray-400"> ({age} years old)</span>
                  )}
                </div>
              )}

              {person.deathday && (
                <div>
                  <span className="text-gray-400 font-semibold">Died: </span>
                  <span>{formatDate(person.deathday)}</span>
                  {age && (
                    <span className="text-gray-400"> (aged {age})</span>
                  )}
                </div>
              )}
            </div>

            {person.biography && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Biography</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {person.biography}
                </p>
              </div>
            )}
          </div>
        </div>

        {directedMovies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Directed ({directedMovies.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {directedMovies.map((movie) => (
                <Link
                  key={movie.tmdbId}
                  href={`/movie/${movie.tmdbId}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
                    {movie.posterPath ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w500${movie.posterPath}`}
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
                      {movie.releaseDate && (
                        <p className="text-xs text-gray-300">
                          {new Date(movie.releaseDate).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {actedMovies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Acted In ({actedMovies.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {actedMovies.map((movie) => (
                <Link
                  key={movie.tmdbId}
                  href={`/movie/${movie.tmdbId}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
                    {movie.posterPath ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w500${movie.posterPath}`}
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
                      {movie.releaseDate && (
                        <p className="text-xs text-gray-300">
                          {new Date(movie.releaseDate).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
        >
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}
