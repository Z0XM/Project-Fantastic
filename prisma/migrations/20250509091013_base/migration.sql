/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('BOOTSTRAP', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_N', 'BRIDGE', 'IPO', 'CROWDFUNDING', 'CONVERTIBLE_NOTE', 'SAFE', 'VENTURE_DEBT', 'WARRANT_OPTION');

-- CreateEnum
CREATE TYPE "StakeholderType" AS ENUM ('FRIENDS_N_FAMILY', 'VENTURE_CAPITALIST', 'ANGEL_INVESTOR', 'PRIVATE_EQUITY', 'CORPORATE_INVESTOR', 'CROWDFUNDING', 'BANK', 'GOVERNMENT', 'OTHER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('COMMON', 'PREFERRED', 'RESTRICTED', 'WARRANT', 'OPTION');

-- CreateEnum
CREATE TYPE "ShareAllocationType" AS ENUM ('ACTUAL_PRICE', 'CONTRACT_PRICE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('INVESTMENT', 'OPTION', 'WARRANT', 'CONVERTIBLE_NOTE', 'SAFE');

-- CreateEnum
CREATE TYPE "ContractDataType" AS ENUM ('NONE', 'URL', 'JSON');

-- CreateEnum
CREATE TYPE "GlobalStates" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoundType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEvents" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "totalShares" INTEGER NOT NULL,
    "balanceShares" INTEGER NOT NULL,
    "valuation" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stakeholders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StakeholderType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "config" JSONB,

    CONSTRAINT "Stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderEvents" (
    "id" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stakeholderId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "shareAllocationType" "ShareAllocationType" NOT NULL,
    "pricePerShare" DECIMAL(65,30) NOT NULL,
    "contractId" TEXT,

    CONSTRAINT "StakeholderEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantAndOptionShares" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shares" INTEGER NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "pricePerShare" DECIMAL(65,30) NOT NULL,
    "stakeholderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "config" JSONB,
    "roundId" TEXT NOT NULL,

    CONSTRAINT "WarrantAndOptionShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stakeholderId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,

    CONSTRAINT "Investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contracts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataType" "ContractDataType" NOT NULL,
    "status" "GlobalStates" NOT NULL,
    "contractUrl" TEXT,
    "contractJson" JSONB,
    "investmentId" TEXT NOT NULL,

    CONSTRAINT "Contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_name_key" ON "Business"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEvents_roundId_key" ON "BusinessEvents"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "StakeholderEvents_stakeholderId_roundId_key" ON "StakeholderEvents"("stakeholderId", "roundId");

-- AddForeignKey
ALTER TABLE "Rounds" ADD CONSTRAINT "Rounds_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEvents" ADD CONSTRAINT "BusinessEvents_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEvents" ADD CONSTRAINT "BusinessEvents_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderEvents" ADD CONSTRAINT "StakeholderEvents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderEvents" ADD CONSTRAINT "StakeholderEvents_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderEvents" ADD CONSTRAINT "StakeholderEvents_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantAndOptionShares" ADD CONSTRAINT "WarrantAndOptionShares_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantAndOptionShares" ADD CONSTRAINT "WarrantAndOptionShares_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantAndOptionShares" ADD CONSTRAINT "WarrantAndOptionShares_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investments" ADD CONSTRAINT "Investments_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investments" ADD CONSTRAINT "Investments_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
