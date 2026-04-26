-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "publicKey" TEXT,
    "avatar" TEXT,
    "nickname" TEXT,
    "bio" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'не указан',
    "age" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT 'не указано',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("age", "avatar", "bio", "createdAt", "gender", "id", "location", "passwordHash", "publicKey", "username") SELECT "age", "avatar", "bio", "createdAt", "gender", "id", "location", "passwordHash", "publicKey", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
