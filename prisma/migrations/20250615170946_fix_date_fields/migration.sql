/*
  Warnings:

  - You are about to drop the column `data` on the `Interacao` table. All the data in the column will be lost.
  - The `nivelAcesso` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('SUPERADMIN', 'ADMIN', 'EDITOR');

-- DropForeignKey
ALTER TABLE "Interacao" DROP CONSTRAINT "Interacao_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Interacao" DROP CONSTRAINT "Interacao_produtoId_fkey";

-- AlterTable
ALTER TABLE "Interacao" DROP COLUMN "data",
ADD COLUMN     "avaliacao" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "nivelAcesso",
ADD COLUMN     "nivelAcesso" "NivelAcesso" NOT NULL DEFAULT 'EDITOR';

-- CreateIndex
CREATE INDEX "Interacao_createdAt_idx" ON "Interacao"("createdAt");

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
