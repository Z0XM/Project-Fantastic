/*
  Warnings:

  - The values [CONVERTIBLE_NOTE,SAFE,WARRANT,OPTION] on the enum `RoundType` will be removed. If these variants are still used in the database, this will fail.
  - The values [WARRANT] on the enum `ShareType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `roundId` on the `WarrantAndOptionShares` table. All the data in the column will be lost.
  - Added the required column `eventType` to the `WarrantAndOptionShares` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoundType_new" AS ENUM ('BOOTSTRAP', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_N', 'BRIDGE', 'IPO', 'CROWDFUNDING', 'VENTURE_DEBT', 'NEW_SHARES', 'STOCK_SPLIT', 'CONTRACT_ISSUE');
ALTER TABLE "Rounds" ALTER COLUMN "type" TYPE "RoundType_new" USING ("type"::text::"RoundType_new");
ALTER TYPE "RoundType" RENAME TO "RoundType_old";
ALTER TYPE "RoundType_new" RENAME TO "RoundType";
DROP TYPE "RoundType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ShareType_new" AS ENUM ('COMMON', 'PREFERRED', 'RESTRICTED', 'OPTION');
ALTER TABLE "StakeholderEvents" ALTER COLUMN "shareType" TYPE "ShareType_new" USING ("shareType"::text::"ShareType_new");
ALTER TABLE "Contracts" ALTER COLUMN "shareType" TYPE "ShareType_new" USING ("shareType"::text::"ShareType_new");
ALTER TYPE "ShareType" RENAME TO "ShareType_old";
ALTER TYPE "ShareType_new" RENAME TO "ShareType";
DROP TYPE "ShareType_old";
COMMIT;

-- DropIndex
DROP INDEX "WarrantAndOptionShares_roundId_stakeholderId_key";

-- AlterTable
ALTER TABLE "WarrantAndOptionShares" DROP COLUMN "roundId",
ADD COLUMN     "eventType" "EventType" NOT NULL;
