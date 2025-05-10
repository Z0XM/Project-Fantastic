/*
  Warnings:

  - The values [DRAFT,APPROVED] on the enum `GlobalStates` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `valuation` on the `BusinessEvents` table. All the data in the column will be lost.
  - Added the required column `postMoneyValuation` to the `BusinessEvents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preMoneyValuation` to the `BusinessEvents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GlobalStates_new" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');
ALTER TABLE "Contracts" ALTER COLUMN "status" TYPE "GlobalStates_new" USING ("status"::text::"GlobalStates_new");
ALTER TYPE "GlobalStates" RENAME TO "GlobalStates_old";
ALTER TYPE "GlobalStates_new" RENAME TO "GlobalStates";
DROP TYPE "GlobalStates_old";
COMMIT;

-- AlterTable
ALTER TABLE "BusinessEvents" DROP COLUMN "valuation",
ADD COLUMN     "postMoneyValuation" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "preMoneyValuation" DECIMAL(65,30) NOT NULL;
