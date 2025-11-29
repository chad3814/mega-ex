'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BrowsePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home since we removed hierarchical navigation
    router.push('/');
  }, [router]);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-xl text-gray-400 mb-4">
            Hierarchical navigation has been replaced with category lists.
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
