import { NextRequest, NextResponse } from 'next/server';
import { getOrFetchPerson } from '@/lib/tmdb/cache';
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
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    const person = await getOrFetchPerson(tmdbId);
    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dateToNumber(person));
  } catch (error) {
    console.error('Person fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}
