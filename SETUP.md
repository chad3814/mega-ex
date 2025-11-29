# Setup Instructions

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your TMDB API key:
```
TMDB_API_KEY="your_actual_tmdb_api_key_here"
```

Get a free TMDB API key at: https://www.themoviedb.org/settings/api

3. **Initialize the database:**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open the application:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Development Notes

- The build process may show warnings - these are expected with the current Next.js/Turbopack/Prisma combination
- For production deployment, you may need to adjust the build configuration
- The app works perfectly in development mode with `npm run dev`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/tmdb/          # API routes for TMDB integration
│   ├── movie/[id]/        # Movie detail pages
│   ├── person/[id]/       # Person/actor pages
│   ├── collection/[id]/   # Collection pages
│   ├── browse/            # Directory browsing
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── tmdb/             # TMDB API integration
│   └── utils/            # Helper functions
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Features

✅ Mega.nz URL processing (client-side)
✅ MP4 file detection with smart filename parsing
✅ TMDB API integration for movie data
✅ SQLite caching for performance
✅ Movie detail pages with cast & crew
✅ Person pages with filmography
✅ Collection pages
✅ Directory navigation
✅ Responsive UI with Tailwind CSS

## Known Issues

- Build process may fail due to Turbopack/Prisma compatibility - use `npm run dev` for development
- megajs library is client-side only (by design)
- TV show support is planned but not yet implemented

## Next Steps

1. Get your TMDB API key
2. Test with a mega.nz share URL
3. Explore the movie database features
4. Consider adding TV show support (see TODO comments in code)
