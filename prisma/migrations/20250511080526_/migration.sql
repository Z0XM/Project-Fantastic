-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'EXIT';

-- AlterEnum
ALTER TYPE "RoundType" ADD VALUE 'EXIT';

-- AlterTable
ALTER TABLE "Stakeholders" ADD COLUMN     "exitedAtPrice" DECIMAL(65,30),
ADD COLUMN     "hasExited" BOOLEAN NOT NULL DEFAULT false;
