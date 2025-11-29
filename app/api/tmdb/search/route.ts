import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb/client';
import { cacheMovie } from '@/lib/tmdb/cache';
import { normalizeString, areStringsEquivalent } from '@/lib/utils/text';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY as string;

async function getAlternativeReleaseDates(movieId: number): Promise<number[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const years = new Set<number>();

    // Collect all release years from all countries
    for (const result of data.results || []) {
      for (const release of result.release_dates || []) {
        if (release.release_date) {
          const releaseYear = new Date(release.release_date).getFullYear();
          if (releaseYear >= 1900 && releaseYear <= new Date().getFullYear() + 1) {
            years.add(releaseYear);
          }
        }
      }
    }

    return Array.from(years).sort();
  } catch (error) {
    console.error('Error fetching release dates:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, year } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Normalize the title (remove accents) for better matching
    const normalizedTitle = normalizeString(title);

    // Try normalized title first (most filenames don't have accents)
    let searchResults = await searchMovies(normalizedTitle, year);

    // If no results and normalized is different, try original
    if (searchResults.results.length === 0 && normalizedTitle !== title) {
      console.log(`No results for normalized "${normalizedTitle}", trying original: "${title}"`);
      searchResults = await searchMovies(title, year);
    }

    // If we have a year but no exact match, try without year and check alternative release dates
    if (searchResults.results.length === 0 && year) {
      console.log(`No results with year ${year}, trying without year constraint`);
      const noYearResults = await searchMovies(normalizedTitle);

      let bestMatch = null;

      // Check ALL results for similar titles with matching years
      for (const result of noYearResults.results) {
        // Normalize both titles for comparison
        const resultNormalized = normalizeString(result.title);
        const searchNormalized = normalizeString(title);

        // Check if titles are similar (exact match or very close)
        const titleMatches = areStringsEquivalent(result.title, normalizedTitle) ||
                            areStringsEquivalent(result.title, title) ||
                            resultNormalized.toLowerCase() === searchNormalized.toLowerCase();

        if (!titleMatches) continue;

        // First check primary release year
        const primaryYear = result.release_date ? new Date(result.release_date).getFullYear() : null;

        if (primaryYear === year) {
          console.log(`Found exact match with primary release year: "${result.title}" (${year})`);
          bestMatch = result;
          break; // Exact primary year match is best, stop here
        }

        // Check if any alternative release date matches our year
        const altYears = await getAlternativeReleaseDates(result.id);
        console.log(`Checking "${result.title}" - Primary year: ${primaryYear}, Alt years: [${altYears.join(', ')}]`);

        if (altYears.includes(year) && !bestMatch) {
          console.log(`Found match with alternative release year: "${result.title}" (${year})`);
          bestMatch = result;
          // Don't break - keep looking for exact primary year match
        }
      }

      if (bestMatch) {
        searchResults = { ...noYearResults, results: [bestMatch] };
      }
    }

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
