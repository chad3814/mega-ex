'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MegaDirectoryItem } from '@/lib/utils/mega-navigation';

interface DirectoryGridProps {
  directories: MegaDirectoryItem[];
}

export default function DirectoryGrid({ directories }: DirectoryGridProps) {
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {directories.map((directory, index) => {
        const newPath = currentPath
          ? `${currentPath}/${directory.name}`
          : directory.name;
        const href = `/browse?path=${encodeURIComponent(newPath)}`;

        return (
          <Link
            key={index}
            href={href}
            className="group"
          >
          <div className="aspect-[2/3] bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center p-6 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-xl">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="font-semibold text-sm line-clamp-2">
                {directory.name}
              </h3>
            </div>
          </div>
          </Link>
        );
      })}
    </div>
  );
}
