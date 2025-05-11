/*
  Warnings:

  - You are about to drop the column `contractJson` on the `Contracts` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerShare` on the `WarrantAndOptionShares` table. All the data in the column will be lost.
  - You are about to drop the column `shareType` on the `WarrantAndOptionShares` table. All the data in the column will be lost.
  - You are about to drop the column `shares` on the `WarrantAndOptionShares` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contracts" DROP COLUMN "contractJson",
ADD COLUMN     "pricePerShare" DECIMAL(65,30),
ADD COLUMN     "shareType" "ShareType";

-- AlterTable
ALTER TABLE "WarrantAndOptionShares" DROP COLUMN "pricePerShare",
DROP COLUMN "shareType",
DROP COLUMN "shares",
ADD COLUMN     "contractId" TEXT;

-- AddForeignKey
ALTER TABLE "WarrantAndOptionShares" ADD CONSTRAINT "WarrantAndOptionShares_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
