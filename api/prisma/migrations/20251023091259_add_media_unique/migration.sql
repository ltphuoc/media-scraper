/*
  Warnings:

  - A unique constraint covering the columns `[pageId,url,type]` on the table `Media` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Media_pageId_url_type_key" ON "Media"("pageId", "url", "type");
