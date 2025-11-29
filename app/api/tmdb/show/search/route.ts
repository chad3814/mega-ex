import { NextRequest, NextResponse } from 'next/server';
import { searchAndCacheShow } from '@/lib/tmdb/tv-cache';

export async function POST(request: NextRequest) {
  try {
    const { title, year } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const show = await searchAndCacheShow(title, year);

    if (!show) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(show);
  } catch (error) {
    console.error('Show search error:', error);
    return NextResponse.json(
      { error: 'Failed to search shows' },
      { status: 500 }
    );
  }
}
