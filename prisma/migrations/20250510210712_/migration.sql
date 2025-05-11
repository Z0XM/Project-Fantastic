/*
  Warnings:

  - You are about to drop the column `dataType` on the `Contracts` table. All the data in the column will be lost.
  - You are about to drop the column `contractId` on the `WarrantAndOptionShares` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contracts" DROP CONSTRAINT "Contracts_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "WarrantAndOptionShares" DROP CONSTRAINT "WarrantAndOptionShares_contractId_fkey";

-- AlterTable
ALTER TABLE "Contracts" DROP COLUMN "dataType",
ADD COLUMN     "warrantOptionsId" TEXT,
ALTER COLUMN "investmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WarrantAndOptionShares" DROP COLUMN "contractId";

-- DropEnum
DROP TYPE "ContractDataType";

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_warrantOptionsId_fkey" FOREIGN KEY ("warrantOptionsId") REFERENCES "WarrantAndOptionShares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
