'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface SearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  const year = searchParams.get('year');

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const searchMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tmdb/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: query,
            year: year ? parseInt(year) : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        } else {
          setError('Failed to search for movies');
        }
      } catch (err) {
        setError('An error occurred while searching');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [query, year]);

  if (!query) {
    return (
      <div className="p-8">
        <p className="text-gray-400">No search query provided</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: 'Search', href: '/search' },
          { label: query, href: `/search?q=${query}` },
        ]}
      />

      <h1 className="text-4xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-400 mb-8">
        Searching for: <span className="text-white">{query}</span>
        {year && <span className="ml-2">({year})</span>}
      </p>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No results found for &quot;{query}&quot;</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="text-gray-400 mb-6">{results.length} results</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((movie) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
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
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
