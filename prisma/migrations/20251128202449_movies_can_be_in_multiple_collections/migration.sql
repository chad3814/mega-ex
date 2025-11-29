/*
  Warnings:

  - You are about to drop the column `collectionId` on the `Movie` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_CollectionToMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CollectionToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollectionToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Movie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "releaseDate" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "voteAverage" REAL,
    "voteCount" INTEGER,
    "runtime" INTEGER,
    "tagline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Movie" ("backdropPath", "createdAt", "id", "overview", "posterPath", "releaseDate", "runtime", "tagline", "title", "tmdbId", "updatedAt", "voteAverage", "voteCount") SELECT "backdropPath", "createdAt", "id", "overview", "posterPath", "releaseDate", "runtime", "tagline", "title", "tmdbId", "updatedAt", "voteAverage", "voteCount" FROM "Movie";
DROP TABLE "Movie";
ALTER TABLE "new_Movie" RENAME TO "Movie";
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToMovie_AB_unique" ON "_CollectionToMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToMovie_B_index" ON "_CollectionToMovie"("B");
