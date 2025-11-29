import Image from 'next/image';
import Link from 'next/link';

interface ShowCardProps {
  show: {
    id: number;
    name: string;
    posterPath: string | null;
    firstAirDate: string | null;
  };
}

export default function ShowCard({ show }: ShowCardProps) {
  const imageUrl = show.posterPath
    ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
    : '/placeholder-poster.png';

  return (
    <Link href={`/show/${show.id}`} className="group flex-shrink-0 w-36">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
        <Image
          src={imageUrl}
          alt={show.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition">
          {show.name}
        </h3>
        {show.firstAirDate && (
          <p className="text-xs text-gray-400">
            {new Date(show.firstAirDate).getFullYear()}
          </p>
        )}
      </div>
    </Link>
  );
}
