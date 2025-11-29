import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb/client';
import { cacheMovie } from '@/lib/tmdb/cache';

export async function POST(request: NextRequest) {
  try {
    const { title, year } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const searchResults = await searchMovies(title, year);

    if (searchResults.results.length === 0) {
      console.error('No movies found for search:', title, year);
      return NextResponse.json(
        { error: 'No movies found' },
        { status: 404 }
      );
    }

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    );
  }
}
