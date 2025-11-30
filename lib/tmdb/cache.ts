import { prisma } from '@/lib/prisma';
import {
  getMovieDetails,
  getPersonDetails,
  getCollectionDetails,
} from './client';
import type { Collection, Movie } from '@/types/movie';
import type { TMDBMovie } from '@/types/tmdb';
import { Person, Role } from '@/types/person';

export async function cacheMovie(tmdbMovie: TMDBMovie): Promise<Movie> {
  // Check if already exists first to avoid race conditions
  const existing = await prisma.movie.findUnique({
    where: { tmdbId: tmdbMovie.id },
    include: {
      genres: true,
      people: {
        include: {
          person: true,
        },
      },
      collections: true,
    },
  });

  if (existing) {
    return {
      ...existing,
      people: existing.people.map((pm) => ({
        id: pm.id,
        role: pm.role as unknown as Role,
        character: pm.character,
        person: pm.person,
        createdAt: pm.createdAt,
      })),
    };
  }

  const directors = tmdbMovie.credits.crew.filter(
    (person) => person.job === 'Director'
  );

  const actors = tmdbMovie.credits.cast.slice(0, 10);

  const cachedGenres = await Promise.all(
    tmdbMovie.genres.map(async (genre) => {
      return prisma.genre.upsert({
        where: { tmdbId: genre.id },
        update: {
          name: genre.name,
        },
        create: {
          tmdbId: genre.id,
          name: genre.name,
        },
      });
    })
  );

  const cachedDirectors = await Promise.all(
    directors.map((director) => cachePerson(director.id))
  );

  const cachedActors = await Promise.all(
    actors.map((actor) => cachePerson(actor.id))
  );

  let collectionId = null;
  if (tmdbMovie.belongs_to_collection) {
    const collection = await cacheCollection(
      tmdbMovie.belongs_to_collection.id
    );
    collectionId = collection.id;
  }

  const dbMovie = await prisma.movie.upsert({
    where: { tmdbId: tmdbMovie.id },
    update: {
      title: tmdbMovie.title,
      overview: tmdbMovie.overview,
      releaseDate: tmdbMovie.release_date,
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      runtime: tmdbMovie.runtime,
      tagline: tmdbMovie.tagline,
      collections: {
        connect: collectionId ? { id: collectionId } : undefined,
      },
      genres: {
        set: cachedGenres.map((g) => ({ id: g.id })),
      },
    },
    create: {
      tmdbId: tmdbMovie.id,
      title: tmdbMovie.title,
      overview: tmdbMovie.overview,
      releaseDate: tmdbMovie.release_date,
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      runtime: tmdbMovie.runtime,
      tagline: tmdbMovie.tagline,
      collections: {
        connect: collectionId ? { id: collectionId } : undefined,
      },
      genres: {
        connect: cachedGenres.map((g) => ({ id: g.id })),
      },
    },
    include: {
      genres: true,
      people: {
        include: {
          person: true,
        },
      },
      collections: true,
    },
  });

  await Promise.all([
    ...cachedDirectors.map((director, index) =>
      prisma.personMovie.upsert({
        where: {
          personId_movieId_role: {
            personId: director.id,
            movieId: dbMovie.id,
            role: 'director',
          },
        },
        update: {},
        create: {
          personId: director.id,
          movieId: dbMovie.id,
          role: 'director',
        },
      })
    ),
    ...cachedActors.map((actor, index) =>
      prisma.personMovie.upsert({
        where: {
          personId_movieId_role: {
            personId: actor.id,
            movieId: dbMovie.id,
            role: 'actor',
          },
        },
        update: {
          character: actors[index].character,
        },
        create: {
          personId: actor.id,
          movieId: dbMovie.id,
          role: 'actor',
          character: actors[index].character,
        },
      })
    ),
  ]);

  const movie: Movie = {
    ...dbMovie,
    people: [...cachedDirectors.map((director) => ({
      id: 0,
      role: Role.director,
      character: null,
      person: director,
      createdAt: new Date(),
    })), ...cachedActors.map((actor, index) => ({
      id: 0,
      role: Role.actor,
      character: actors[index].character,
      person: actor,
      createdAt: new Date(),
    }))],
  };
  return movie;
}

export async function cachePerson(tmdbPersonId: number): Promise<Person> {
  // First check if it exists
  const existing = await prisma.person.findUnique({
    where: { tmdbId: tmdbPersonId },
  });

  if (existing) return existing;

  // Fetch from TMDB
  const tmdbPerson = await getPersonDetails(tmdbPersonId);

  // Use upsert to handle race conditions
  return prisma.person.upsert({
    where: { tmdbId: tmdbPerson.id },
    update: {
      name: tmdbPerson.name,
      biography: tmdbPerson.biography,
      birthday: tmdbPerson.birthday,
      deathday: tmdbPerson.deathday,
      profilePath: tmdbPerson.profile_path,
    },
    create: {
      tmdbId: tmdbPerson.id,
      name: tmdbPerson.name,
      biography: tmdbPerson.biography,
      birthday: tmdbPerson.birthday,
      deathday: tmdbPerson.deathday,
      profilePath: tmdbPerson.profile_path,
    },
  });
}

export async function cacheCollection(tmdbCollectionId: number): Promise<Collection> {
  // First check if it exists
  const existing = await prisma.collection.findUnique({
    where: { tmdbId: tmdbCollectionId },
  });

  if (existing) return existing;

  // Fetch from TMDB
  const tmdbCollection = await getCollectionDetails(tmdbCollectionId);

  // Use upsert to handle race conditions
  return prisma.collection.upsert({
    where: { tmdbId: tmdbCollection.id },
    update: {
      name: tmdbCollection.name,
      overview: tmdbCollection.overview,
      posterPath: tmdbCollection.poster_path,
      backdropPath: tmdbCollection.backdrop_path,
    },
    create: {
      tmdbId: tmdbCollection.id,
      name: tmdbCollection.name,
      overview: tmdbCollection.overview,
      posterPath: tmdbCollection.poster_path,
      backdropPath: tmdbCollection.backdrop_path,
    },
  });
}

export async function getOrFetchMovie(tmdbId: number): Promise<Movie> {
  const cached = await prisma.movie.findUnique({
    where: { tmdbId },
    include: {
      genres: true,
      people: {
        include: {
          person: true,
        },
      },
      collections: true,
    },
  });

  if (cached) {
    const movie: Movie = {
      ...cached,
      people: cached.people.map((pm) => ({
        id: pm.id,
        role: pm.role as unknown as Role,
        character: pm.character,
        person: pm.person,
        createdAt: pm.createdAt,
      })),
    };
    return movie;
  }

  const tmdbMovie = await getMovieDetails(tmdbId);
  return cacheMovie(tmdbMovie);
}

export async function getOrFetchPerson(tmdbId: number): Promise<Person & { movies: { movie: Movie; role: Role; character: string | null }[] }> {
  // Fetch person details from TMDB to get complete filmography
  const tmdbPerson = await getPersonDetails(tmdbId);

  // Cache person in database
  const person = await prisma.person.upsert({
    where: { tmdbId: tmdbPerson.id },
    update: {
      name: tmdbPerson.name,
      biography: tmdbPerson.biography,
      birthday: tmdbPerson.birthday,
      deathday: tmdbPerson.deathday,
      profilePath: tmdbPerson.profile_path,
    },
    create: {
      tmdbId: tmdbPerson.id,
      name: tmdbPerson.name,
      biography: tmdbPerson.biography,
      birthday: tmdbPerson.birthday,
      deathday: tmdbPerson.deathday,
      profilePath: tmdbPerson.profile_path,
    },
  });

  // Convert TMDB movie credits to our Movie format
  const actedMovies = tmdbPerson.movie_credits.cast.map((credit) => ({
    movie: {
      id: 0,
      tmdbId: credit.id,
      title: credit.title,
      overview: null,
      releaseDate: credit.release_date,
      posterPath: credit.poster_path,
      backdropPath: null,
      voteAverage: null,
      voteCount: null,
      runtime: null,
      tagline: null,
      genres: [],
      people: [],
      collections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Movie,
    role: Role.actor,
    character: credit.character || null,
  }));

  const directedMovies = tmdbPerson.movie_credits.crew
    .filter((credit) => credit.job === 'Director')
    .map((credit) => ({
      movie: {
        id: 0,
        tmdbId: credit.id,
        title: credit.title,
        overview: null,
        releaseDate: credit.release_date,
        posterPath: credit.poster_path,
        backdropPath: null,
        voteAverage: null,
        voteCount: null,
        runtime: null,
        tagline: null,
        genres: [],
        people: [],
        collections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Movie,
      role: Role.director,
      character: null,
    }));

  return {
    ...person,
    movies: [...actedMovies, ...directedMovies],
  };
}

export async function getOrFetchCollection(tmdbId: number): Promise<Collection & { parts: { id: number; title: string; poster_path: string | null; release_date: string }[] }> {
  let cached = await prisma.collection.findUnique({
    where: { tmdbId },
    include: {
      movies: {
        include: {
          genres: true,
        },
      },
    },
  });

  if (!cached) {
    await cacheCollection(tmdbId);
    cached = await prisma.collection.findUnique({
      where: { tmdbId },
      include: {
        movies: {
          include: {
            genres: true,
          },
        },
      },
    });
  }

  if (!cached) {
    throw new Error('Collection not found after caching');
  }

  const tmdbCollection = await getCollectionDetails(tmdbId);

  return {
    ...cached,
    parts: tmdbCollection.parts,
  } as unknown as Collection & { parts: { id: number; title: string; poster_path: string | null; release_date: string }[] };
}
