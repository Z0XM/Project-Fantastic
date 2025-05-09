/*
  Warnings:

  - You are about to drop the column `config` on the `Stakeholders` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Stakeholders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stakeholders" DROP COLUMN "config",
DROP COLUMN "type";

-- CreateTable
CREATE TABLE "StakeholderInBusiness" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stakeholderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "StakeholderType" NOT NULL,
    "config" JSONB,

    CONSTRAINT "StakeholderInBusiness_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StakeholderInBusiness" ADD CONSTRAINT "StakeholderInBusiness_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderInBusiness" ADD CONSTRAINT "StakeholderInBusiness_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
