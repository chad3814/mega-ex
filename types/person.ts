import { DateContainer } from "@/lib/utils/date";

export interface Person extends DateContainer {
    id: number;
    tmdbId: number;
    name: string;
    biography: string | null;
    birthday: string | null;
    deathday: string | null;
    profilePath: string | null;
    createdAt: Date | number;
}

export enum Role {
    actor,
    director,
    writer,
    producer,
    composer,
    editor,
    cinematographer,
};

export interface PersonRole extends DateContainer {
    id: number;
    role: Role;
    character: string | null;
    person: Person;
    createdAt: Date | number;
}
