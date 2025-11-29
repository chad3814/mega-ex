export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number;
  tagline: string;
  genres: TMDBGenre[];
  credits: {
    cast: TMDBCast[];
    crew: TMDBCrew[];
  };
  belongs_to_collection: TMDBCollection | null;
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBSearchMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  profile_path: string | null;
  movie_credits: {
    cast: TMDBPersonMovieCredit[];
    crew: TMDBPersonMovieCredit[];
  };
}

export interface TMDBPersonMovieCredit {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  character?: string;
  job?: string;
}

export interface TMDBCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TMDBCollectionPart[];
}

export interface TMDBCollectionPart {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres: TMDBGenre[];
  seasons: TMDBSeason[];
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episode_count: number;
}

export interface TMDBSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number;
  vote_average: number;
  crew: TMDBCrew[];
  guest_stars: TMDBCast[];
}

export interface TMDBShowSearchResult {
  page: number;
  results: TMDBShowSearchItem[];
  total_pages: number;
  total_results: number;
}

export interface TMDBShowSearchItem {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  overview: string;
}
