import { NextRequest, NextResponse } from 'next/server';
import { getOrFetchMovie } from '@/lib/tmdb/cache';
import { dateToNumber } from '@/lib/utils/date';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tmdbId = parseInt(id);

    if (isNaN(tmdbId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }

    const movie = await getOrFetchMovie(tmdbId);
    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(dateToNumber(movie));
  } catch (error) {
    console.error('Movie fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie' },
      { status: 500 }
    );
  }
}
