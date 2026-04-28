-- CreateTable
CREATE TABLE "WallVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "WallVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WallPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WallVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
