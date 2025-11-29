import { Person } from './person';

export interface Show {
  id: number;
  tmdbId: number;
  name: string;
  overview: string | null;
  firstAirDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  genres: Genre[];
  seasons: Season[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: number;
  showId: number;
  tmdbId: number;
  seasonNumber: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  airDate: string | null;
  episodeCount: number | null;
  episodes: Episode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: number;
  seasonId: number;
  tmdbId: number;
  episodeNumber: number;
  name: string | null;
  overview: string | null;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  voteAverage: number | null;
  megaThumbnail: string | null;
  megaFileKey: string | null;
  megaPath: string | null;
  people: PersonEpisode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonEpisode {
  id: number;
  role: string;
  character: string | null;
  person: Person;
  createdAt: Date;
}

export interface Genre {
  id: number;
  tmdbId: number;
  name: string;
  createdAt: Date;
}
