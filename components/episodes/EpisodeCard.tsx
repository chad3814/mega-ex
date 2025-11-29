import Image from 'next/image';
import Link from 'next/link';

interface EpisodeCardProps {
  episode: {
    id: number;
    episodeNumber: number;
    name: string | null;
    stillPath: string | null;
    megaThumbnail: string | null;
  };
  showId: number;
  seasonNumber: number;
}

export default function EpisodeCard({ episode, showId, seasonNumber }: EpisodeCardProps) {
  const imageUrl = episode.stillPath
    ? `https://image.tmdb.org/t/p/w500${episode.stillPath}`
    : episode.megaThumbnail || '/placeholder-episode.png';

  const title = episode.name || `Episode ${episode.episodeNumber}`;

  return (
    <Link href={`/episode/${episode.id}`} className="group">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-2">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
          E{episode.episodeNumber}
        </div>
      </div>
      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition">
        {title}
      </h3>
    </Link>
  );
}
