/*
  Warnings:

  - A unique constraint covering the columns `[tokenConfirmacao]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "tokenConfirmacao" TEXT,
ADD COLUMN     "tokenExpiracao" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "admins_tokenConfirmacao_key" ON "admins"("tokenConfirmacao");
