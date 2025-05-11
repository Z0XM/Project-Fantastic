-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NONE', 'OPTION', 'WARRANT', 'CONVERTIBLE_NOTE', 'SAFE');

-- AlterTable
ALTER TABLE "Contracts" ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'NONE';
