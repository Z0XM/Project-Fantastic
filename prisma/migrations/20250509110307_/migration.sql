/*
  Warnings:

  - You are about to drop the column `name` on the `Stakeholders` table. All the data in the column will be lost.
  - You are about to drop the `StakeholderInBusiness` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[businessId,roundId]` on the table `BusinessEvents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stakeholderId,roundId]` on the table `Investments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,businessId]` on the table `Stakeholders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roundId,stakeholderId]` on the table `WarrantAndOptionShares` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `Stakeholders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Stakeholders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Stakeholders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StakeholderInBusiness" DROP CONSTRAINT "StakeholderInBusiness_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StakeholderInBusiness" DROP CONSTRAINT "StakeholderInBusiness_stakeholderId_fkey";

-- AlterTable
ALTER TABLE "Stakeholders" DROP COLUMN "name",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "config" JSONB,
ADD COLUMN     "type" "StakeholderType" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "StakeholderInBusiness";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_name_key" ON "Users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEvents_businessId_roundId_key" ON "BusinessEvents"("businessId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Investments_stakeholderId_roundId_key" ON "Investments"("stakeholderId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Stakeholders_userId_businessId_key" ON "Stakeholders"("userId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantAndOptionShares_roundId_stakeholderId_key" ON "WarrantAndOptionShares"("roundId", "stakeholderId");

-- AddForeignKey
ALTER TABLE "Stakeholders" ADD CONSTRAINT "Stakeholders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stakeholders" ADD CONSTRAINT "Stakeholders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
