-- CreateTable
CREATE TABLE "Show" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "firstAirDate" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "voteAverage" REAL,
    "voteCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "showId" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "airDate" TEXT,
    "episodeCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Season_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonId" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "stillPath" TEXT,
    "airDate" TEXT,
    "runtime" INTEGER,
    "voteAverage" REAL,
    "megaThumbnail" TEXT,
    "megaFileKey" TEXT,
    "megaPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonEpisode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "character" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonEpisode_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PersonEpisode_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GenreToShow" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_GenreToShow_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GenreToShow_B_fkey" FOREIGN KEY ("B") REFERENCES "Show" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Show_tmdbId_key" ON "Show"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_tmdbId_key" ON "Season"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_showId_seasonNumber_key" ON "Season"("showId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_tmdbId_key" ON "Episode"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEpisode_personId_episodeId_role_key" ON "PersonEpisode"("personId", "episodeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToShow_AB_unique" ON "_GenreToShow"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToShow_B_index" ON "_GenreToShow"("B");
