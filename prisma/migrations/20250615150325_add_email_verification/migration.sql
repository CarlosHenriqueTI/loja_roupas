/*
  Warnings:

  - You are about to drop the `interacoes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[emailToken]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "interacoes" DROP CONSTRAINT "interacoes_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "interacoes" DROP CONSTRAINT "interacoes_produtoId_fkey";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "emailToken" TEXT,
ADD COLUMN     "emailTokenExpira" TIMESTAMP(3),
ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpira" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "imagens" TEXT[];

-- DropTable
DROP TABLE "interacoes";

-- CreateTable
CREATE TABLE "Interacao" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT,
    "nota" INTEGER,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,

    CONSTRAINT "Interacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interacao_produtoId_idx" ON "Interacao"("produtoId");

-- CreateIndex
CREATE INDEX "Interacao_clienteId_idx" ON "Interacao"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_emailToken_key" ON "clientes"("emailToken");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_resetToken_key" ON "clientes"("resetToken");

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
