'use client';

import { ReactNode, useRef, useState, useEffect, Children } from 'react';

interface HorizontalListProps {
  title: string;
  children: ReactNode;
  itemWidth: number; // Width of each item in pixels (e.g., 144 for w-36)
}

export default function HorizontalList({ title, children, itemWidth }: HorizontalListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const childrenArray = Children.toArray(children);
  const totalPages = Math.ceil(childrenArray.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const visibleItems = childrenArray.slice(startIdx, endIdx);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const gap = 16; // gap-4 in pixels
        const items = Math.floor(containerWidth / (itemWidth + gap));
        const calculatedItems = Math.max(1, items);

        setItemsPerPage(calculatedItems);
        setCurrentPage(0); // Reset to first page when items per page changes
      }
    };

    // Use ResizeObserver for accurate container size tracking
    const resizeObserver = new ResizeObserver(() => {
      calculateItemsPerPage();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', calculateItemsPerPage);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, [itemWidth]);

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition flex-shrink-0"
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition flex-shrink-0"
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={containerRef} className="overflow-hidden">
        <div className="flex gap-4">
          {visibleItems}
        </div>
      </div>
    </div>
  );
}
