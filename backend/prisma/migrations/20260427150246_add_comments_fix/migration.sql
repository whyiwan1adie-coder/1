-- CreateTable
CREATE TABLE "WallComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "audio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "WallComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WallPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WallComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WallPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "image" TEXT,
    "audio" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "WallPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WallPost" ("audio", "createdAt", "id", "image", "text", "userId") SELECT "audio", "createdAt", "id", "image", "text", "userId" FROM "WallPost";
DROP TABLE "WallPost";
ALTER TABLE "new_WallPost" RENAME TO "WallPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
