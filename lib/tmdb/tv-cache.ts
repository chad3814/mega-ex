import { prisma } from '@/lib/prisma';
import {
  getShowDetails,
  getSeasonDetails,
  searchTVShows,
} from './client';
import { Show, Season, Episode } from '@/types/show';
import { TMDBShow, TMDBSeasonDetails } from '@/types/tmdb';
import { cachePerson } from './cache';

export async function cacheShow(tmdbShow: TMDBShow): Promise<Show> {
  const cachedGenres = await Promise.all(
    tmdbShow.genres.map(async (genre) => {
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

  const dbShow = await prisma.show.upsert({
    where: { tmdbId: tmdbShow.id },
    update: {
      name: tmdbShow.name,
      overview: tmdbShow.overview,
      firstAirDate: tmdbShow.first_air_date,
      posterPath: tmdbShow.poster_path,
      backdropPath: tmdbShow.backdrop_path,
      voteAverage: tmdbShow.vote_average,
      voteCount: tmdbShow.vote_count,
      genres: {
        set: cachedGenres.map((g) => ({ id: g.id })),
      },
    },
    create: {
      tmdbId: tmdbShow.id,
      name: tmdbShow.name,
      overview: tmdbShow.overview,
      firstAirDate: tmdbShow.first_air_date,
      posterPath: tmdbShow.poster_path,
      backdropPath: tmdbShow.backdrop_path,
      voteAverage: tmdbShow.vote_average,
      voteCount: tmdbShow.vote_count,
      genres: {
        connect: cachedGenres.map((g) => ({ id: g.id })),
      },
    },
    include: {
      genres: true,
      seasons: {
        include: {
          episodes: true,
        },
      },
    },
  });

  // Cache basic season info from the show details
  await Promise.all(
    tmdbShow.seasons
      .filter((s) => s.season_number > 0) // Skip specials
      .map(async (season) => {
        await prisma.season.upsert({
          where: { tmdbId: season.id },
          update: {
            seasonNumber: season.season_number,
            name: season.name,
            overview: season.overview,
            posterPath: season.poster_path,
            airDate: season.air_date,
            episodeCount: season.episode_count,
          },
          create: {
            showId: dbShow.id,
            tmdbId: season.id,
            seasonNumber: season.season_number,
            name: season.name,
            overview: season.overview,
            posterPath: season.poster_path,
            airDate: season.air_date,
            episodeCount: season.episode_count,
          },
        });
      })
  );

  const show: Show = {
    ...dbShow,
    seasons: dbShow.seasons.map((s) => ({
      ...s,
      episodes: s.episodes.map((e) => ({
        ...e,
        people: [],
      })),
    })),
  };

  return show;
}

export async function cacheSeason(
  showId: number,
  tmdbShowId: number,
  seasonNumber: number
): Promise<Season> {
  const tmdbSeason = await getSeasonDetails(tmdbShowId, seasonNumber);

  const dbSeason = await prisma.season.upsert({
    where: { tmdbId: tmdbSeason.id },
    update: {
      seasonNumber: tmdbSeason.season_number,
      name: tmdbSeason.name,
      overview: tmdbSeason.overview,
      posterPath: tmdbSeason.poster_path,
      airDate: tmdbSeason.air_date,
      episodeCount: tmdbSeason.episodes.length,
    },
    create: {
      showId,
      tmdbId: tmdbSeason.id,
      seasonNumber: tmdbSeason.season_number,
      name: tmdbSeason.name,
      overview: tmdbSeason.overview,
      posterPath: tmdbSeason.poster_path,
      airDate: tmdbSeason.air_date,
      episodeCount: tmdbSeason.episodes.length,
    },
    include: {
      episodes: {
        include: {
          people: {
            include: {
              person: true,
            },
          },
        },
      },
    },
  });

  // Cache episodes
  await Promise.all(
    tmdbSeason.episodes.map((episode) => cacheEpisode(dbSeason.id, episode))
  );

  const season: Season = {
    ...dbSeason,
    episodes: dbSeason.episodes.map((e) => ({
      ...e,
      people: e.people.map((p) => ({
        id: p.id,
        role: p.role,
        character: p.character,
        person: p.person,
        createdAt: p.createdAt,
      })),
    })),
  };

  return season;
}

export async function cacheEpisode(
  seasonId: number,
  tmdbEpisode: TMDBSeasonDetails['episodes'][0],
  megaData?: {
    thumbnail?: string;
    fileKey?: string;
    path?: string;
  }
): Promise<Episode> {
  // Cache guest stars and crew
  const guestStars = tmdbEpisode.guest_stars.slice(0, 5);
  const directors = tmdbEpisode.crew.filter((c) => c.job === 'Director');

  const cachedGuestStars = await Promise.all(
    guestStars.map((actor) => cachePerson(actor.id))
  );

  const cachedDirectors = await Promise.all(
    directors.map((director) => cachePerson(director.id))
  );

  const dbEpisode = await prisma.episode.upsert({
    where: { tmdbId: tmdbEpisode.id },
    update: {
      episodeNumber: tmdbEpisode.episode_number,
      name: tmdbEpisode.name,
      overview: tmdbEpisode.overview,
      stillPath: tmdbEpisode.still_path,
      airDate: tmdbEpisode.air_date,
      runtime: tmdbEpisode.runtime,
      voteAverage: tmdbEpisode.vote_average,
      megaThumbnail: megaData?.thumbnail,
      megaFileKey: megaData?.fileKey,
      megaPath: megaData?.path,
    },
    create: {
      seasonId,
      tmdbId: tmdbEpisode.id,
      episodeNumber: tmdbEpisode.episode_number,
      name: tmdbEpisode.name,
      overview: tmdbEpisode.overview,
      stillPath: tmdbEpisode.still_path,
      airDate: tmdbEpisode.air_date,
      runtime: tmdbEpisode.runtime,
      voteAverage: tmdbEpisode.vote_average,
      megaThumbnail: megaData?.thumbnail,
      megaFileKey: megaData?.fileKey,
      megaPath: megaData?.path,
    },
    include: {
      people: {
        include: {
          person: true,
        },
      },
    },
  });

  // Cache person-episode relationships
  await Promise.all([
    ...cachedGuestStars.map((actor, index) =>
      prisma.personEpisode.upsert({
        where: {
          personId_episodeId_role: {
            personId: actor.id,
            episodeId: dbEpisode.id,
            role: 'actor',
          },
        },
        update: {
          character: guestStars[index].character,
        },
        create: {
          personId: actor.id,
          episodeId: dbEpisode.id,
          role: 'actor',
          character: guestStars[index].character,
        },
      })
    ),
    ...cachedDirectors.map((director) =>
      prisma.personEpisode.upsert({
        where: {
          personId_episodeId_role: {
            personId: director.id,
            episodeId: dbEpisode.id,
            role: 'director',
          },
        },
        update: {},
        create: {
          personId: director.id,
          episodeId: dbEpisode.id,
          role: 'director',
        },
      })
    ),
  ]);

  const episode: Episode = {
    ...dbEpisode,
    people: dbEpisode.people.map((p) => ({
      id: p.id,
      role: p.role,
      character: p.character,
      person: p.person,
      createdAt: p.createdAt,
    })),
  };

  return episode;
}

export async function getOrFetchShow(tmdbId: number): Promise<Show> {
  const cached = await prisma.show.findUnique({
    where: { tmdbId },
    include: {
      genres: true,
      seasons: {
        include: {
          episodes: true,
        },
        orderBy: {
          seasonNumber: 'asc',
        },
      },
    },
  });

  if (cached) {
    return {
      ...cached,
      seasons: cached.seasons.map((s) => ({
        ...s,
        episodes: s.episodes.map((e) => ({
          ...e,
          people: [],
        })),
      })),
    };
  }

  const tmdbShow = await getShowDetails(tmdbId);
  return cacheShow(tmdbShow);
}

export async function searchAndCacheShow(
  title: string,
  year?: number
): Promise<Show | null> {
  const searchResults = await searchTVShows(title, year);

  if (searchResults.results.length === 0) {
    return null;
  }

  const firstResult = searchResults.results[0];
  return getOrFetchShow(firstResult.id);
}
