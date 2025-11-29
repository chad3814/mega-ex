import { prisma } from '@/lib/prisma';
import { cacheSeason } from '@/lib/tmdb/tv-cache';
import Breadcrumb from '@/components/Breadcrumb';
import EpisodeCard from '@/components/episodes/EpisodeCard';

interface SeasonPageProps {
  params: Promise<{ id: string; seasonNumber: string }>;
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { id, seasonNumber } = await params;
  const showId = parseInt(id);
  const seasonNum = parseInt(seasonNumber);

  // Get show info
  const show = await prisma.show.findUnique({
    where: { id: showId },
  });

  if (!show) {
    return (
      <div className="p-8">
        <p className="text-red-500">Show not found</p>
      </div>
    );
  }

  // Get or fetch season
  let season = await prisma.season.findFirst({
    where: {
      showId: showId,
      seasonNumber: seasonNum,
    },
    include: {
      episodes: {
        orderBy: {
          episodeNumber: 'asc',
        },
        include: {
          people: {
            include: {
              person: true,
            },
          },
        },
      },
    },
  });

  // If season not found or has no episodes, fetch from TMDB
  if (!season || season.episodes.length === 0) {
    const cachedSeason = await cacheSeason(showId, show.tmdbId, seasonNum);
    season = await prisma.season.findFirst({
      where: {
        showId: showId,
        seasonNumber: seasonNum,
      },
      include: {
        episodes: {
          orderBy: {
            episodeNumber: 'asc',
          },
          include: {
            people: {
              include: {
                person: true,
              },
            },
          },
        },
      },
    });
  }

  if (!season) {
    return (
      <div className="p-8">
        <p className="text-red-500">Season not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: 'Shows', href: '/shows' },
          { label: show.name, href: `/show/${show.id}` },
          {
            label: `Season ${seasonNum}`,
            href: `/show/${show.id}/season/${seasonNum}`,
          },
        ]}
      />

      <h1 className="text-4xl font-bold mb-2">{show.name}</h1>
      <h2 className="text-2xl text-gray-400 mb-8">{season.name}</h2>

      {season.overview && (
        <p className="text-gray-300 mb-8 max-w-4xl">{season.overview}</p>
      )}

      {season.episodes.length === 0 && (
        <p className="text-gray-400">No episodes found for this season.</p>
      )}

      {season.episodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {season.episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={{
                id: episode.id,
                episodeNumber: episode.episodeNumber,
                name: episode.name,
                stillPath: episode.stillPath,
                megaThumbnail: episode.megaThumbnail,
              }}
              showId={showId}
              seasonNumber={seasonNum}
            />
          ))}
        </div>
      )}
    </div>
  );
}
