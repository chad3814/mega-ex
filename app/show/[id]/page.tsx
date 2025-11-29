import { getOrFetchShow } from '@/lib/tmdb/tv-cache';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import HorizontalList from '@/components/HorizontalList';

interface ShowPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowPage({ params }: ShowPageProps) {
  const { id } = await params;
  const showId = parseInt(id);
  const show = await getOrFetchShow(showId);

  const backdropUrl = show.backdropPath
    ? `https://image.tmdb.org/t/p/original${show.backdropPath}`
    : null;

  const posterUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
    : '/placeholder-poster.png';

  // Get seasons with at least one episode
  const seasonsWithEpisodes = show.seasons.filter(s => (s.episodeCount ?? 0) > 0);

  return (
    <div>
      {backdropUrl && (
        <div className="relative h-96 -mt-8">
          <Image
            src={backdropUrl}
            alt={show.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>
      )}

      <div className="p-8">
        <Breadcrumb
          items={[
            { label: 'Shows', href: '/shows' },
            { label: show.name, href: `/show/${show.id}` },
          ]}
        />

        <div className="flex gap-8 mb-12">
          <div className="flex-shrink-0 w-64">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={posterUrl}
                alt={show.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">{show.name}</h1>

            {show.firstAirDate && (
              <p className="text-gray-400 mb-4">
                {new Date(show.firstAirDate).getFullYear()}
              </p>
            )}

            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {show.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {show.voteAverage && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-xl font-semibold">
                  {show.voteAverage.toFixed(1)}
                </span>
                <span className="text-gray-400 text-sm">
                  ({show.voteCount?.toLocaleString()} votes)
                </span>
              </div>
            )}

            {show.overview && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{show.overview}</p>
              </div>
            )}
          </div>
        </div>

        {seasonsWithEpisodes.length > 0 && (
          <HorizontalList title="Seasons" itemWidth={144}>
            {seasonsWithEpisodes.map((season) => (
              <Link
                key={season.id}
                href={`/show/${show.id}/season/${season.seasonNumber}`}
                className="group flex-shrink-0 w-36"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                  {season.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${season.posterPath}`}
                      alt={season.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl text-gray-600">
                      📺
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition">
                  {season.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {season.episodeCount} episodes
                </p>
              </Link>
            ))}
          </HorizontalList>
        )}
      </div>
    </div>
  );
}
