/*
  Warnings:

  - The values [WARRANT_OPTION] on the enum `RoundType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoundType_new" AS ENUM ('BOOTSTRAP', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_N', 'BRIDGE', 'IPO', 'CROWDFUNDING', 'CONVERTIBLE_NOTE', 'SAFE', 'VENTURE_DEBT', 'WARRANT', 'OPTION', 'NEW_SHARES', 'STOCK_SPLIT');
ALTER TABLE "Rounds" ALTER COLUMN "type" TYPE "RoundType_new" USING ("type"::text::"RoundType_new");
ALTER TYPE "RoundType" RENAME TO "RoundType_old";
ALTER TYPE "RoundType_new" RENAME TO "RoundType";
DROP TYPE "RoundType_old";
COMMIT;
