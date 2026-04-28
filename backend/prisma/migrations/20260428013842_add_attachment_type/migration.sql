-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accessKeyHash" TEXT,
    "publicKey" TEXT,
    "avatar" TEXT,
    "nickname" TEXT,
    "bio" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'не указан',
    "age" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT 'не_указано',
    "languages" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'offline',
    "wallPrivacy" TEXT NOT NULL DEFAULT 'all',
    "avatarPrivacy" TEXT NOT NULL DEFAULT 'all',
    "subscribePrivacy" TEXT NOT NULL DEFAULT 'all',
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "digitalGhost" INTEGER NOT NULL DEFAULT 0,
    "paranoiaLevel" INTEGER NOT NULL DEFAULT 0,
    "attachmentType" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("accessKeyHash", "age", "avatar", "avatarPrivacy", "bio", "createdAt", "digitalGhost", "gender", "id", "languages", "location", "nickname", "paranoiaLevel", "passwordHash", "publicKey", "status", "subscribePrivacy", "subscriberCount", "username", "wallPrivacy") SELECT "accessKeyHash", "age", "avatar", "avatarPrivacy", "bio", "createdAt", "digitalGhost", "gender", "id", "languages", "location", "nickname", "paranoiaLevel", "passwordHash", "publicKey", "status", "subscribePrivacy", "subscriberCount", "username", "wallPrivacy" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
