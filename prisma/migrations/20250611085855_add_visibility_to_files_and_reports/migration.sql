-- DropForeignKey
ALTER TABLE "Error" DROP CONSTRAINT "Error_auditId_fkey";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isVisibleToClient" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "isVisibleToClient" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Error" ADD CONSTRAINT "Error_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
