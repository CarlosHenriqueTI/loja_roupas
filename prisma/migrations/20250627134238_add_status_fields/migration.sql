-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('ATIVO', 'INATIVO', 'SUSPENSO', 'BLOQUEADO', 'PENDENTE', 'EXCLUIDO');

-- CreateEnum
CREATE TYPE "StatusProduto" AS ENUM ('ATIVO', 'INATIVO', 'DESCONTINUADO', 'RASCUNHO', 'ESGOTADO');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "StatusConta" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "status" "StatusConta" NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "ultimoLogin" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "status" "StatusProduto" NOT NULL DEFAULT 'ATIVO';
