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
  const directors = tmdbMovie.credits.crew.filter(
    (person) => person.job === 'Director'
  );

  const actors = tmdbMovie.credits.cast.slice(0, 10);

  const cachedGenres = await Promise.all(
    tmdbMovie.genres.map(async (genre) => {
      const existing = await prisma.genre.findUnique({
        where: { tmdbId: genre.id },
      });

      if (existing) return existing;

      return prisma.genre.create({
        data: {
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
      people: true,
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
  const existing = await prisma.person.findUnique({
    where: { tmdbId: tmdbPersonId },
  });

  if (existing) return existing;

  const tmdbPerson = await getPersonDetails(tmdbPersonId);

  return prisma.person.create({
    data: {
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
  const existing = await prisma.collection.findUnique({
    where: { tmdbId: tmdbCollectionId },
  });

  if (existing) return existing;

  const tmdbCollection = await getCollectionDetails(tmdbCollectionId);

  return prisma.collection.create({
    data: {
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
  const cached = await prisma.person.findUnique({
    where: { tmdbId },
    include: {
      movies: {
        include: {
          movie: {
            include: {
              genres: true,
              collections: true,
            },
          },
        },
      },
    },
  });

  if (cached) {
    return {
      ...cached,
      movies: cached.movies.map((pm) => ({
        movie: { ...pm.movie, people: [] } as Movie,
        role: pm.role as unknown as Role,
        character: pm.character,
      })),
    };
  }

  await cachePerson(tmdbId);

  const refetched = await prisma.person.findUnique({
    where: { tmdbId },
    include: {
      movies: {
        include: {
          movie: {
            include: {
              genres: true,
              collections: true,
            },
          },
        },
      },
    },
  });

  if (!refetched) {
    throw new Error('Person not found after caching');
  }

  return {
    ...refetched,
    movies: refetched.movies.map((pm) => ({
      movie: { ...pm.movie, people: [] } as Movie,
      role: pm.role as unknown as Role,
      character: pm.character,
    })),
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
