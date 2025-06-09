-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_auditId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_auditId_fkey";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
