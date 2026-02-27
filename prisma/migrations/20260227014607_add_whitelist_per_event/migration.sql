/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Certificate` table. All the data in the column will be lost.
  - You are about to alter the column `certX` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `certY` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `nameX` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `nameY` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- CreateTable
CREATE TABLE "Whitelist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Whitelist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "certNo" TEXT,
    "eventId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("certNo", "eventId", "id", "name") SELECT "certNo", "eventId", "id", "name" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventName" TEXT NOT NULL,
    "templateUrl" TEXT NOT NULL,
    "certPrefix" TEXT NOT NULL DEFAULT 'CERT/2026',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiryDate" DATETIME,
    "nameX" REAL NOT NULL,
    "nameY" REAL NOT NULL,
    "certX" REAL NOT NULL,
    "certY" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("certX", "certY", "eventName", "id", "nameX", "nameY", "templateUrl") SELECT "certX", "certY", "eventName", "id", "nameX", "nameY", "templateUrl" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_name_eventId_key" ON "Whitelist"("name", "eventId");
