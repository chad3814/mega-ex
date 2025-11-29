# Mega.nz Movie Browser

A Next.js application that allows you to browse movies from mega.nz shares and discover detailed information using the TMDB API.

## Features

- Browse mega.nz shares for MP4 files
- Automatic movie detection and year extraction from filenames
- Integration with TMDB for movie information, posters, and metadata
- Detailed movie pages with cast, directors, and collection information
- Person pages with filmography and biography
- Collection pages showing all movies in a collection
- Directory navigation for nested mega.nz folders
- SQLite caching for improved performance

## Setup

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` and add your TMDB API key:
```
TMDB_API_KEY="your_actual_tmdb_api_key"
```

Get a free TMDB API key at: https://www.themoviedb.org/settings/api

4. Initialize the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a mega.nz share URL in the input field
2. Click "Browse" to scan the share for movies
3. The app will:
   - Recursively search for .mp4 files
   - Extract movie titles and years from filenames
   - Query TMDB for movie information
   - Display movie posters in a grid
   - Show directories for navigation

4. Click on a movie poster to see detailed information
5. Click on actors/directors to see their filmography
6. Click on collections to see all movies in that collection

## File Detection Logic

The app uses smart detection to identify movies:

- **Year detection**: Finds 4-digit numbers between 1900 and the current year, uses the last one found
- **Movie vs TV**:
  - Detects as movie if path contains: "movie", "film", "flick", or "flix"
  - Detects as TV if path contains "show" or "series", or filename matches `\W[Ss]\d+[Ee]\d+\W` (e.g., S01E01)
- **Title cleaning**: Removes file extensions, years, and special characters

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **APIs**:
  - TMDB API for movie data
  - mega.js for mega.nz integration
- **Image Optimization**: Next.js Image component

## Project Structure

```
├── app/
│   ├── api/tmdb/          # API routes for TMDB
│   ├── movie/[id]/        # Movie detail pages
│   ├── person/[id]/       # Person detail pages
│   ├── collection/[id]/   # Collection pages
│   ├── browse/            # Directory navigation
│   └── page.tsx           # Home page
├── components/
│   ├── movies/            # Movie-related components
│   ├── people/            # Person-related components
│   └── collections/       # Collection components
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── tmdb/              # TMDB API client & caching
│   └── utils/             # Utilities (file parser, mega client)
├── prisma/
│   └── schema.prisma      # Database schema
└── types/
    └── tmdb.ts            # TypeScript types
```

## Database Schema

- **Movie**: Stores movie metadata from TMDB
- **Person**: Stores actor/director information
- **PersonMovie**: Junction table for movie-person relationships
- **Collection**: Stores movie collection information
- **Genre**: Stores movie genres

## Notes

- The mega.js integration runs entirely on the client side for security
- TMDB API calls are cached in SQLite to reduce API usage
- Only movies are currently supported (TV shows coming in future updates)
- The app requires a valid TMDB API key to function

## License

MIT
