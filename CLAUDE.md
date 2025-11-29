# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js application that browses mega.nz shares for movies and integrates with TMDB (The Movie Database) API to display rich movie information. Uses SQLite for caching TMDB data to reduce API calls.

## Essential Commands

### Development
```bash
npm run dev                 # Start development server (http://localhost:3000)
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
```

### Database
```bash
npx prisma generate        # Generate Prisma client (required after schema changes)
npx prisma migrate dev     # Create and apply new migration
npm run db:studio          # Open Prisma Studio GUI
```

### First-Time Setup
```bash
npm install
cp .env.example .env       # Then add your TMDB_API_KEY
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Architecture

### Data Flow
1. **Client-side mega.nz browsing**: megajs library runs entirely in browser for security
2. **File parsing**: lib/utils/file-parser.ts extracts movie titles and years from filenames
3. **TMDB integration**: lib/tmdb/client.ts fetches movie/show data, lib/tmdb/cache.ts and lib/tmdb/tv-cache.ts manage database caching
4. **Client-side caching**: contexts/MediaCacheContext.tsx provides IndexedDB caching for TMDB search results with background queue processing
5. **Database layer**: Prisma ORM with custom output path (generated/prisma) and PostgreSQL via pg adapter

### Key Architecture Patterns

**Prisma Custom Setup**
- Client generated to `generated/prisma` (not default node_modules)
- Uses PostgreSQL with pg adapter (was SQLite with BetterSqlite3)
- Custom import path: `import { PrismaClient } from 'db/client'`
- Configuration in prisma.config.ts with DATABASE_URL from .env
- Connection pool managed in lib/prisma.ts for optimal performance

**TMDB Caching Strategy**
- **Server-side**: lib/tmdb/cache.ts and lib/tmdb/tv-cache.ts cache in PostgreSQL database
- **Client-side**: contexts/MediaCacheContext.tsx caches search results in IndexedDB with background queue
- Upsert pattern: check cache → fetch if missing → store in database
- Caches movies, shows, seasons, episodes, persons, collections, and genres with relationships
- Client cache persists across sessions and prevents duplicate API calls
- Background queue processes all files from mega.nz share automatically

**File Parsing Intelligence** (lib/utils/file-parser.ts)
- Year extraction: Finds last 4-digit number between 1900-current year
- TV detection: Pattern matching for S01E01 format or YYYY-MM-DD dates
- Movie/TV classification: Path keywords (movie/film vs show/series)
- Returns ParsedFileInfo with cleanTitle, year, mediaType

**Route Structure**
- App Router with dynamic routes: movie/[id], person/[id], collection/[id]
- API routes at app/api/tmdb/* proxy TMDB requests server-side
- /browse page handles mega.nz directory navigation with query params

### Important Files

**lib/prisma.ts**: Singleton Prisma client with custom adapter setup
**lib/tmdb/cache.ts**: Core caching logic with upsert patterns for all entities
**lib/utils/file-parser.ts**: Movie filename parsing and media type detection
**prisma.config.ts**: Custom Prisma configuration (not standard setup)
**next.config.ts**: Configures TMDB image domains and serverExternalPackages for 'db'

## Development Patterns

### TypeScript Paths
- `@/*` maps to project root for clean imports
- Database client imported as `db/client` (not @prisma/client)

### Image Handling
- TMDB images configured in next.config.ts remotePatterns
- Base URL: https://image.tmdb.org/t/p
- Use Next.js Image component for automatic optimization

### Adding New TMDB Entities
1. Add TypeScript type in types/tmdb.ts or types/*.ts
2. Add Prisma model in prisma/schema.prisma
3. Run `npx prisma migrate dev` to create migration
4. Add caching function in lib/tmdb/cache.ts following upsert pattern
5. Add client function in lib/tmdb/client.ts for API call

### Known Constraints
- Build process may fail with Turbopack/Prisma (use `npm run dev` for development)
- megajs is client-side only (cannot run in server components)
- TV show support is planned but not implemented (file parser detects but app only handles movies)
- Database schema uses custom output path - always use `db/client` import

## Environment Variables

Required in .env:
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/mega_ex`)
- `TMDB_API_KEY`: Get from https://www.themoviedb.org/settings/api
- `NEXT_PUBLIC_TMDB_IMAGE_BASE_URL`: TMDB image CDN (default: https://image.tmdb.org/t/p)
- `NEXT_PUBLIC_BASE_URL`: Your app URL (default: http://localhost:3000)

## Deployment Notes

### Vercel Deployment
- PostgreSQL database required (use Vercel Postgres, Supabase, or similar)
- Set `DATABASE_URL` environment variable in Vercel dashboard
- Run `npx prisma migrate deploy` in build command or post-deploy hook
- Ensure `TMDB_API_KEY` is set in environment variables

## Testing Approach
- No test suite currently exists
- Manual testing: Enter mega.nz URL → browse → click movies/people/collections
- Prisma Studio (`npm run db:studio`) for database inspection
