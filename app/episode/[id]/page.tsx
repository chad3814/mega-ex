import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import HorizontalList from '@/components/HorizontalList';

interface EpisodePageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { id } = await params;
  const episodeId = parseInt(id);

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          show: true,
        },
      },
      people: {
        include: {
          person: true,
        },
      },
    },
  });

  if (!episode) {
    return (
      <div className="p-8">
        <p className="text-red-500">Episode not found</p>
      </div>
    );
  }

  const show = episode.season.show;
  const season = episode.season;

  const imageUrl = episode.stillPath
    ? `https://image.tmdb.org/t/p/original${episode.stillPath}`
    : episode.megaThumbnail || '/placeholder-episode.png';

  const title = episode.name || `Episode ${episode.episodeNumber}`;
  const episodeLabel = `S${season.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`;

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: 'Shows', href: '/shows' },
          { label: show.name, href: `/show/${show.id}` },
          {
            label: `Season ${season.seasonNumber}`,
            href: `/show/${show.id}/season/${season.seasonNumber}`,
          },
          {
            label: title,
            href: `/episode/${episode.id}`,
          },
        ]}
      />

      <div className="max-w-6xl">
        <div className="mb-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-4">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm font-semibold">
              {episodeLabel}
            </span>
            {episode.runtime && (
              <span className="text-gray-400">{episode.runtime} min</span>
            )}
            {episode.voteAverage && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>{episode.voteAverage.toFixed(1)}</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2">{title}</h1>
          <p className="text-xl text-gray-400 mb-4">{show.name}</p>

          {episode.airDate && (
            <p className="text-gray-400 mb-6">
              Aired: {new Date(episode.airDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          {episode.overview && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{episode.overview}</p>
            </div>
          )}
        </div>

        {episode.people.length > 0 && (
          <HorizontalList title="Cast & Crew" itemWidth={120}>
            {episode.people.map((personEpisode) => (
              <Link
                key={personEpisode.id}
                href={`/person/${personEpisode.person.id}`}
                className="group flex-shrink-0 w-30"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                  {personEpisode.person.profilePath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${personEpisode.person.profilePath}`}
                      alt={personEpisode.person.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-600">
                      👤
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition">
                  {personEpisode.person.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1">
                  {personEpisode.character || personEpisode.role}
                </p>
              </Link>
            ))}
          </HorizontalList>
        )}
      </div>
    </div>
  );
}
