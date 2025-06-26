// src/scripts/reset-database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Limpando banco de dados...');

    // Deletar todas as interações primeiro (devido às foreign keys)
    await prisma.interacao.deleteMany({});
    console.log('✅ Interações deletadas');

    // Deletar produtos
    await prisma.produto.deleteMany({});
    console.log('✅ Produtos deletados');

    // Deletar clientes
    await prisma.cliente.deleteMany({});
    console.log('✅ Clientes deletados');

    // Deletar admins
    await prisma.admin.deleteMany({});
    console.log('✅ Admins deletados');

    console.log('🎉 Banco de dados limpo com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();