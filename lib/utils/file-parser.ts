const EPISODE_PATTERN = /[Ss]\d+[Ee]\d+/;
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;
const MOVIE_KEYWORDS = ['movie', 'film', 'flick', 'flix'];
const TV_KEYWORDS = ['show', 'series'];

export interface ParsedFileInfo {
  filename: string;
  pathname: string;
  year: number | null;
  mediaType: 'movie' | 'tv' | 'unknown';
  cleanTitle: string;
  episodeInfo?: string;
}

export function parseFileInfo(filename: string, pathname: string): ParsedFileInfo {
  const currentYear = new Date().getFullYear();

  // Remove extension
  let name = filename.replace(/\.mp4$/i, '');

  // Check for episode pattern BEFORE tokenizing (S01E01)
  const episodeMatch = name.match(EPISODE_PATTERN);
  if (episodeMatch) {
    const episodeIndex = name.indexOf(episodeMatch[0]);
    const titlePart = name.substring(0, episodeIndex);
    const cleanTitle = titlePart.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      filename,
      pathname,
      year: null,
      mediaType: 'tv',
      cleanTitle,
      episodeInfo: episodeMatch[0],
    };
  }

  // Check for date pattern BEFORE tokenizing (YYYY-MM-DD)
  const dateMatch = name.match(DATE_PATTERN);
  if (dateMatch) {
    const dateIndex = name.indexOf(dateMatch[0]);
    const titlePart = name.substring(0, dateIndex);
    const cleanTitle = titlePart.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      filename,
      pathname,
      year: null,
      mediaType: 'tv',
      cleanTitle,
      episodeInfo: dateMatch[0],
    };
  }

  // Replace all non-alphanumeric characters with spaces for movie parsing
  const normalizedName = name.replace(/[^a-zA-Z0-9]/g, ' ');

  // Split by one or more spaces
  const tokens = normalizedName.split(/\s+/).filter(Boolean);

  // Find the last token that is exactly 4 digits and between 1900 and currentYear + 1
  let yearIndex = -1;
  let year: number | null = null;

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^\d{4}$/.test(tokens[i])) {
      const potentialYear = parseInt(tokens[i]);
      if (potentialYear >= 1900 && potentialYear <= currentYear + 1) {
        yearIndex = i;
        year = potentialYear;
        break;
      }
    }
  }

  // If we found a year, everything before it is the title
  let cleanTitle: string;
  if (yearIndex !== -1) {
    cleanTitle = tokens.slice(0, yearIndex).join(' ').trim();
  } else {
    cleanTitle = tokens.join(' ').trim();
  }

  // Determine media type based on pathname keywords
  const mediaType = detectMediaType(filename, pathname);

  return {
    filename,
    pathname,
    year,
    mediaType,
    cleanTitle,
  };
}

function detectMediaType(filename: string, pathname: string): 'movie' | 'tv' | 'unknown' {
  const lowerFilename = filename.toLowerCase();
  const lowerPathname = pathname.toLowerCase();

  // Episode pattern means TV
  if (EPISODE_PATTERN.test(filename) || DATE_PATTERN.test(filename)) {
    return 'tv';
  }

  const hasMovieKeyword = MOVIE_KEYWORDS.some(keyword =>
    lowerPathname.includes(keyword)
  );

  const hasTvKeyword = TV_KEYWORDS.some(keyword =>
    lowerPathname.includes(keyword)
  );

  if (hasMovieKeyword) return 'movie';
  if (hasTvKeyword) return 'tv';

  return 'unknown';
}
