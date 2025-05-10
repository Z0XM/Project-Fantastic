-- AddForeignKey
ALTER TABLE "StakeholderEvents" ADD CONSTRAINT "StakeholderEvents_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
