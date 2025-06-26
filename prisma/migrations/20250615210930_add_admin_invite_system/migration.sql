/*
  Warnings:

  - A unique constraint covering the columns `[emailToken]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "conviteAceito" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conviteEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailToken" TEXT,
ADD COLUMN     "emailTokenExpira" TIMESTAMP(3),
ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "senhaDefinida" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "senha" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_emailToken_key" ON "admins"("emailToken");
