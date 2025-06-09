/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Audit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Audit_url_key" ON "Audit"("url");
