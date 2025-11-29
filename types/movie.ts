import { DateContainer } from '@/lib/utils/date';
import type { PersonRole } from './person';

export interface Genre extends DateContainer {
    id: number;
    name: string;
    tmdbId: number;
    createdAt: Date | number;
}

export interface Collection extends DateContainer {
    id: number;
    tmdbId: number;
    name: string;
    overview: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    createdAt: Date | number;
}

export interface Movie extends DateContainer {
    id: number;
    tmdbId: number;
    title: string;
    overview: string | null;
    releaseDate: string | null;
    runtime: number | null;
    posterPath: string | null;
    backdropPath: string | null;
    tagline: string | null;
    genres: Genre[];
    people: PersonRole[];
    collections: Collection[];
    createdAt: Date | number;
    updatedAt: Date | number;
}
