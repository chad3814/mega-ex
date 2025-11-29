import Image from 'next/image';

interface EpisodeCardSimpleProps {
  episode: {
    cleanTitle: string;
    episodeNumber?: number;
    seasonNumber?: number;
    episodeInfo?: string;
  };
}

export default function EpisodeCardSimple({ episode }: EpisodeCardSimpleProps) {
  const title = episode.cleanTitle;
  const episodeLabel = episode.seasonNumber && episode.episodeNumber
    ? `S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`
    : episode.episodeInfo || 'Episode';

  return (
    <div className="group flex-shrink-0 w-60">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl text-gray-600">📺</div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
          {episodeLabel}
        </div>
      </div>
      <h3 className="font-semibold text-sm line-clamp-2">
        {title}
      </h3>
    </div>
  );
}
