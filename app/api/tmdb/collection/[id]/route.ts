import { NextRequest, NextResponse } from 'next/server';
import { getOrFetchCollection } from '@/lib/tmdb/cache';
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
        { error: 'Invalid collection ID' },
        { status: 400 }
      );
    }

    const collection = await getOrFetchCollection(tmdbId);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dateToNumber(collection));
  } catch (error) {
    console.error('Collection fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
